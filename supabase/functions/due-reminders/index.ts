// Supabase Edge Function: emails a reminder the day before a Fixed expense is due
// when nothing has been logged for that category in the due month.
//
// Runs daily from pg_cron (see supabase/reminders.sql). Secrets (set in Supabase, never in git):
//   RESEND_API_KEY   required   Resend API key
//   CRON_SECRET      required   shared secret the cron job sends in the x-cron-secret header
//   RESEND_FROM      optional   default "Quantix Codex <onboarding@resend.dev>"
//   NOTIFY_TO        optional   comma-separated recipients; default = emails of Active users
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.
//
// Test without sending:  POST {"dry": true, "today": "2026-10-04"}  (today = pretend date, YYYY-MM-DD)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TZ = 'Asia/Manila';
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), { status, headers: { 'Content-Type': 'application/json' } });

const pad = (n: number) => String(n).padStart(2, '0');
const manilaToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());

function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const niceDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET') || !Deno.env.get('CRON_SECRET')) {
    return json({ error: 'unauthorized' }, 401);
  }

  const body = await req.json().catch(() => ({}));
  const today: string = /^\d{4}-\d{2}-\d{2}$/.test(body.today ?? '') ? body.today : manilaToday();
  const dry = body.dry === true;

  const tomorrow = addDays(today, 1);
  const [y, m, day] = tomorrow.split('-').map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const monthStart = `${y}-${pad(m)}-01`;
  const monthEnd = `${y}-${pad(m)}-${pad(daysInMonth)}`;

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // Fixed categories whose (monthly) due day is tomorrow. A due day of 31 falls on the last day of shorter months.
  const { data: cats, error: catErr } = await db
    .from('expense_details')
    .select('expense_category, due_date')
    .eq('expense_type', 'Fixed Expenses')
    .not('due_date', 'is', null);
  if (catErr) return json({ error: catErr.message }, 500);

  const dueTomorrow = (cats ?? []).filter((c) => Math.min(Number(String(c.due_date).slice(8, 10)), daysInMonth) === day);
  if (dueTomorrow.length === 0) return json({ today, tomorrow, due: [], sent: 0, note: 'nothing due tomorrow' });

  // Which of them already have an expense logged in the due month?
  const { data: paidRows, error: expErr } = await db
    .from('expenses')
    .select('expense_category')
    .eq('expense_type', 'Fixed Expenses')
    .gte('date', monthStart)
    .lte('date', monthEnd);
  if (expErr) return json({ error: expErr.message }, 500);
  const paid = new Set((paidRows ?? []).map((r) => r.expense_category));
  const unpaid = dueTomorrow.map((c) => c.expense_category).filter((name) => !paid.has(name)).sort();
  if (unpaid.length === 0) return json({ today, tomorrow, due: dueTomorrow.map((c) => c.expense_category), unpaid: [], sent: 0, note: 'all already paid' });

  // Recipients
  let recipients: string[] = (Deno.env.get('NOTIFY_TO') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  if (recipients.length === 0) {
    const { data: people, error: pErr } = await db.from('profiles').select('email').eq('status', 'Active');
    if (pErr) return json({ error: pErr.message }, 500);
    recipients = (people ?? []).map((p) => p.email).filter(Boolean) as string[];
  }
  if (dry) return json({ today, tomorrow, unpaid, recipients, dry: true });
  if (recipients.length === 0) return json({ today, tomorrow, unpaid, sent: 0, note: 'no recipients' });

  const label = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const subject = unpaid.length === 1
    ? `Reminder: ${unpaid[0]} is due tomorrow`
    : `Reminder: ${unpaid.length} fixed expenses are due tomorrow`;
  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;max-width:480px;margin:auto;color:#16202A">
      <h2 style="margin:0 0 8px">Fixed expenses due tomorrow</h2>
      <p style="margin:0 0 16px;color:#5B6773">Due ${escapeHtml(niceDate(tomorrow))}. Nothing has been logged for ${escapeHtml(label)} yet:</p>
      <ul style="padding-left:20px;line-height:1.8">${unpaid.map((n) => `<li><strong>${escapeHtml(n)}</strong></li>`).join('')}</ul>
      <p style="color:#5B6773;font-size:13px">Log the payment in Quantix Codex to stop these reminders.</p>
    </div>`;

  const from = Deno.env.get('RESEND_FROM') ?? 'Quantix Codex <onboarding@resend.dev>';
  const results = [];
  for (const to of recipients) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html }),
    });
    results.push({ to, ok: res.ok, status: res.status, detail: res.ok ? undefined : await res.text() });
  }
  return json({ today, tomorrow, unpaid, sent: results.filter((r) => r.ok).length, results });
});
