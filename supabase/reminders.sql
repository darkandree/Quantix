-- Schedules the due-date reminder email. Run in the Supabase SQL editor AFTER deploying the
-- `due-reminders` Edge Function (see supabase/functions/due-reminders/index.ts).
--
-- 1. Replace YOUR_CRON_SECRET below with the same value you stored as the CRON_SECRET secret.
-- 2. Run the whole script. It is safe to re-run (it replaces the existing job).

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Remove an older version of the job, if any.
select cron.unschedule(jobid) from cron.job where jobname = 'due-reminders';

-- 00:00 UTC = 8:00 AM in Manila, every day.
select cron.schedule(
  'due-reminders',
  '0 0 * * *',
  $$
  select net.http_post(
    url     := 'https://tvqnkxnzvsgttswylwpx.supabase.co/functions/v1/due-reminders',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', 'YOUR_CRON_SECRET'),
    body    := '{}'::jsonb
  );
  $$
);
