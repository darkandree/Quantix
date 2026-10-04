import React, { useMemo } from 'react';
import MonthSelect from './MonthSelect.jsx';
import MonthlyReport from './MonthlyReport.jsx';
import { CalendarIcon, ExpensesIcon, LayersIcon, LockIcon, TrendIcon, WalletIcon } from './Icons.jsx';
import { byNewest, displayDate, expensesForMonth, fmt, prevMonthKey, totalsFor } from '../lib/format.js';

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

export default function Dashboard({ expenses, month, onMonthChange }) {
  const list = useMemo(() => expensesForMonth(expenses, month), [expenses, month]);
  const cur = useMemo(() => totalsFor(list), [list]);
  const hasPrev = month !== 'all';
  const prev = useMemo(() => totalsFor(hasPrev ? expensesForMonth(expenses, prevMonthKey(month)) : []), [expenses, month, hasPrev]);

  const categoryTotals = useMemo(() => {
    const totals = {};
    list.forEach((e) => { totals[e.expense_category] = (totals[e.expense_category] || 0) + Number(e.amount || 0); });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [list]);
  const categories = useMemo(() => [...new Set(list.map((e) => e.expense_category))], [list]);
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
          <div><div className="stat-num">{list.length}</div><div className="stat-label">Expenses</div></div>
          <span className="stat-icon neutral"><LayersIcon /></span>
        </div>
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
        <div className="stat-card">
          <div><div className="stat-num red">{categories.length}</div><div className="stat-label">Categories used</div></div>
          <span className="stat-icon red"><ExpensesIcon /></span>
        </div>
      </div>

      <div className="card">
        <h3>Spending by Type</h3>
        <table className="plain-table">
          <thead><tr><th>Name</th><th className="num">Entries</th><th className="num">Amount</th><th className="num">Share</th></tr></thead>
          <tbody>
            {[['Fixed Expenses', 'Fixed Expenses', cur.totalFixed], ['Variable Expenses', 'Variable Expenses', cur.totalVariable]].map(([label, type, amt]) => (
              <tr key={type}>
                <td>{label}</td>
                <td className="num">{list.filter((e) => e.expense_type === type).length}</td>
                <td className="num">{fmt(amt)}</td>
                <td className="num">{cur.totalAll > 0 ? ((amt / cur.totalAll) * 100).toFixed(1) + '%' : '�'}</td>
              </tr>
            ))}
            <tr className="total"><td>Total</td><td className="num">{list.length}</td><td className="num">{fmt(cur.totalAll)}</td><td className="num">{cur.totalAll > 0 ? '100%' : '�'}</td></tr>
          </tbody>
        </table>
      </div>
      <div className="dash-grid">
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

      <MonthlyReport expenses={expenses} month={month} />
    </section>
  );
}
