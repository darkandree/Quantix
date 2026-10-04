import React, { useMemo } from 'react';
import MonthSelect from './MonthSelect.jsx';
import MonthlyReport from './MonthlyReport.jsx';
import { CalendarIcon, LockIcon, TrendIcon, WalletIcon } from './Icons.jsx';
import { byNewest, displayDate, expensesForMonth, fmt, monthLabel, prevMonthKey, totalsFor } from '../lib/format.js';

function Trend({ current, previous, enabled }) {
  if (!enabled) return <div className="trend-indicator" />;
  const diff = current - previous;
  if (previous === 0) {
    return current === 0
      ? <div className="trend-indicator" />
      : <div className="trend-indicator up">New · +{fmt(diff)} vs last month</div>;
  }
  const pct = (diff / previous) * 100;
  if (Math.abs(pct) < 0.05) return <div className="trend-indicator flat">No change vs last month</div>;
  const up = pct > 0;
  return (
    <div className={'trend-indicator ' + (up ? 'up' : 'down')}>
      {up ? '▲ +' : '▼ −'}{fmt(Math.abs(diff))} ({Math.abs(pct).toFixed(1)}%) vs last month
    </div>
  );
}

// Which fixed categories have an expense logged in the selected month.
function FixedStatus({ expenses, month, fixedCategories }) {
  const rows = useMemo(() => {
    if (month === 'all') return [];
    const paid = {};
    expensesForMonth(expenses, month)
      .filter((e) => e.expense_type === 'Fixed Expenses')
      .forEach((e) => {
        const p = paid[e.expense_category] || (paid[e.expense_category] = { amount: 0, date: '' });
        p.amount += Number(e.amount || 0);
        if (String(e.date) > p.date) p.date = String(e.date);
      });
    const names = new Set([...fixedCategories, ...Object.keys(paid)]);
    return [...names].sort((a, b) => a.localeCompare(b)).map((name) => ({ name, paid: paid[name] }));
  }, [expenses, month, fixedCategories]);

  const paidCount = rows.filter((r) => r.paid).length;

  return (
    <div className="card">
      <div className="report-header">
        <h3>Fixed expenses status</h3>
        {month !== 'all' && <span className="report-hint">{paidCount} of {rows.length} paid · {monthLabel(month)}</span>}
      </div>
      {month === 'all'
        ? <div className="empty-note">Select a specific month to see which fixed expenses are paid.</div>
        : rows.length === 0
          ? <div className="empty-note">No fixed categories found.</div>
          : rows.map((r) => (
            <div className="recent-item" key={r.name}>
              <div>
                <div className="rec-cat">{r.name}</div>
                <div className="rec-date">{r.paid ? `${fmt(r.paid.amount)} · paid ${displayDate(r.paid.date)}` : 'No payment logged this month'}</div>
              </div>
              <span className={'tag ' + (r.paid ? 'fixed' : 'variable')}>{r.paid ? 'Paid' : 'Unpaid'}</span>
            </div>
          ))}
    </div>
  );
}

export default function Dashboard({ expenses, month, onMonthChange, fixedCategories }) {
  const list = useMemo(() => expensesForMonth(expenses, month), [expenses, month]);
  const cur = useMemo(() => totalsFor(list), [list]);
  const hasPrev = month !== 'all';
  const prev = useMemo(() => totalsFor(hasPrev ? expensesForMonth(expenses, prevMonthKey(month)) : []), [expenses, month, hasPrev]);

  const categoryTotals = useMemo(() => {
    const totals = {};
    list.forEach((e) => { totals[e.expense_category] = (totals[e.expense_category] || 0) + Number(e.amount || 0); });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [list]);
  const recent = useMemo(() => [...list].sort(byNewest).slice(0, 5), [list]);

  const fixedPct = cur.totalAll > 0 ? (cur.totalFixed / cur.totalAll) * 100 : 0;
  const donutBg = cur.totalAll > 0
    ? `conic-gradient(var(--fixed) 0% ${fixedPct}%, var(--variable) ${fixedPct}% 100%)`
    : 'var(--line)';

  return (
    <section className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <div className="header-controls">
          <CalendarIcon />
          <MonthSelect expenses={expenses} value={month} onChange={onMonthChange} />
          <span className="page-sub">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div>
            <div className="stat-num">{fmt(cur.totalAll)}</div><div className="stat-label">Total spent</div>
            <Trend current={cur.totalAll} previous={prev.totalAll} enabled={hasPrev} />
          </div>
          <span className="stat-icon teal"><WalletIcon /></span>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-num">{fmt(cur.totalFixed)}</div><div className="stat-label">Fixed expenses</div>
            <Trend current={cur.totalFixed} previous={prev.totalFixed} enabled={hasPrev} />
          </div>
          <span className="stat-icon teal"><LockIcon /></span>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-num">{fmt(cur.totalVariable)}</div><div className="stat-label">Variable expenses</div>
            <Trend current={cur.totalVariable} previous={prev.totalVariable} enabled={hasPrev} />
          </div>
          <span className="stat-icon red"><TrendIcon /></span>
        </div>
      </div>

      <div className="dash-grid even">
        <div className="card">
          <h3>Fixed vs Variable</h3>
          <div className="chart-row">
            <div className="donut" style={{ background: donutBg }}>
              <div className="donut-center">{cur.totalAll > 0 ? fmt(cur.totalAll) : 'No data'}</div>
            </div>
            <div className="legend">
              <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--fixed)' }} />Fixed<span className="amt">{fmt(cur.totalFixed)}</span></div>
              <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--variable)' }} />Variable<span className="amt">{fmt(cur.totalVariable)}</span></div>
            </div>
          </div>
        </div>
        <FixedStatus expenses={expenses} month={month} fixedCategories={fixedCategories} />
      </div>

      <div className="dash-grid even">
        <div className="card">
          <h3>Top categories</h3>
          {categoryTotals.length === 0
            ? <div className="empty-note">No expenses for this period.</div>
            : categoryTotals.map(([cat, amt]) => (
              <div className="bar-row" key={cat}>
                <div className="bar-top"><span>{cat}</span><span className="amt">{fmt(amt)}</span></div>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${((amt / categoryTotals[0][1]) * 100).toFixed(1)}%` }} /></div>
              </div>
            ))}
        </div>
        <div className="card">
          <h3>Recent expenses</h3>
          {recent.length === 0
            ? <div className="empty-note">No expenses for this period.</div>
            : recent.map((e) => (
              <div className="recent-item" key={e.id}>
                <div>
                  <div className="rec-cat">{e.expense_category}</div>
                  <div className="rec-date">{displayDate(e.date)}</div>
                </div>
                <div className="rec-amt">{fmt(e.amount)}</div>
              </div>
            ))}
        </div>
      </div>

      <MonthlyReport expenses={expenses} month={month} />
    </section>
  );
}
