import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { daysInMonthFor, fmt, monthKey, monthLabel, parseExpenseDate } from '../lib/format.js';

const SECTIONS = [
  { label: 'Fixed', type: 'Fixed Expenses' },
  { label: 'Variable', type: 'Variable Expenses' },
];

function Popover({ anchor, cat, items, dateLabel, onClose }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, arrowLeft: 12, below: false, show: false });

  useLayoutEffect(() => {
    const rect = anchor.getBoundingClientRect();
    const pop = ref.current.getBoundingClientRect();
    let top = rect.top - pop.height - 12;
    const below = top < 10;
    if (below) top = rect.bottom + 12;
    const left = Math.max(10, Math.min(rect.left + rect.width / 2 - pop.width / 2, window.innerWidth - pop.width - 10));
    const arrowLeft = Math.max(12, Math.min(rect.left + rect.width / 2 - left, pop.width - 12));
    setPos({ top: top + window.scrollY, left: left + window.scrollX, arrowLeft, below, show: true });
  }, [anchor]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    const onDown = (e) => {
      if (!ref.current.contains(e.target) && !e.target.closest('.report-clickable')) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('scroll', onClose, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('scroll', onClose, true);
    };
  }, [onClose]);

  const total = items.reduce((s, e) => s + Number(e.amount || 0), 0);
  return createPortal(
    <div
      ref={ref}
      className={`report-popover ${pos.below ? 'arrow-bottom' : 'arrow-top'}${pos.show ? ' show' : ''}`}
      style={{ top: pos.top, left: pos.left }}
    >
      <div className="report-popover-header">
        <div className="rp-cat">{cat}</div>
        <div className="rp-date">{dateLabel}</div>
      </div>
      <div className="report-popover-body">
        {items.length === 0 && <div className="report-popover-empty">No line items found.</div>}
        {items.map((e) => (
          <div className="report-popover-row" key={e.id}>
            <span className="rp-label">{[e.product_name, e.remarks].filter(Boolean).join(' · ') || 'Unlabeled expense'}</span>
            <span className="rp-amt">{fmt(e.amount)}</span>
          </div>
        ))}
      </div>
      <div className="report-popover-footer"><span>Total</span><span>{fmt(total)}</span></div>
      <div className="report-popover-arrow" style={{ left: pos.arrowLeft }} />
    </div>,
    document.body,
  );
}

export default function MonthlyReport({ expenses, month }) {
  const [detail, setDetail] = useState(null); // { anchor, cat, day }
  useEffect(() => setDetail(null), [month, expenses]);

  const report = useMemo(() => {
    if (!month || month === 'all') return null;
    const monthExpenses = expenses.filter((e) => monthKey(e.date) === month);
    const days = daysInMonthFor(month);
    const dayTotals = new Array(days + 1).fill(0);
    let grandTotal = 0;
    const sections = [];
    SECTIONS.forEach((section) => {
      const catMap = {};
      monthExpenses.filter((e) => e.expense_type === section.type).forEach((e) => {
        const d = parseExpenseDate(e.date);
        if (!d) return;
        catMap[e.expense_category] = catMap[e.expense_category] || new Array(days + 1).fill(0);
        catMap[e.expense_category][d.getDate()] += Number(e.amount) || 0;
      });
      const names = Object.keys(catMap).sort();
      if (!names.length) return;
      const totals = new Array(days + 1).fill(0);
      const rows = names.map((cat) => {
        const arr = catMap[cat];
        const rowTotal = arr.reduce((s, v) => s + v, 0);
        arr.forEach((v, d) => { totals[d] += v; dayTotals[d] += v; });
        grandTotal += rowTotal;
        return { cat, arr, rowTotal };
      });
      sections.push({ ...section, rows, totals, total: totals.reduce((s, v) => s + v, 0) });
    });
    return { days, sections, dayTotals, grandTotal };
  }, [expenses, month]);

  let body;
  let hint = '';
  if (!report) {
    body = <div className="report-empty">Select a specific month above to see the daily breakdown.</div>;
  } else if (!report.sections.length) {
    body = <div className="report-empty">No expenses logged for {monthLabel(month)}.</div>;
  } else {
    const [y, m] = month.split('-').map(Number);
    const { days, sections, dayTotals, grandTotal } = report;
    const dayNums = Array.from({ length: days }, (_, i) => i + 1);
    const cell = (v, i) => <td key={i}>{v > 0 ? fmt(v) : '—'}</td>;
    hint = `${monthLabel(month)} · ${fmt(grandTotal)} total`;
    body = (
      <table className="report-table">
        <thead>
          <tr>
            <th>Category</th>
            {dayNums.map((d) => (
              <th key={d}>{d}<span className="weekday">{new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'narrow' })}</span></th>
            ))}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {sections.map((s) => (
            <React.Fragment key={s.type}>
              <tr className="report-section"><td colSpan={days + 2}>{s.label}</td></tr>
              {s.rows.map((r) => (
                <tr key={r.cat}>
                  <td>{r.cat}</td>
                  {dayNums.map((d) => (r.arr[d] > 0
                    ? <td key={d} className="report-nonzero report-clickable" onClick={(e) => setDetail({ anchor: e.currentTarget, cat: r.cat, day: d })}>{fmt(r.arr[d])}</td>
                    : <td key={d} className="report-zero">—</td>))}
                  <td>{fmt(r.rowTotal)}</td>
                </tr>
              ))}
              <tr className="report-total-row">
                <td>{s.label} total</td>
                {dayNums.map((d) => cell(s.totals[d], d))}
                <td>{fmt(s.total)}</td>
              </tr>
            </React.Fragment>
          ))}
          <tr className="report-grand-total">
            <td>Total</td>
            {dayNums.map((d) => cell(dayTotals[d], d))}
            <td>{fmt(grandTotal)}</td>
          </tr>
        </tbody>
      </table>
    );
  }

  let popover = null;
  if (detail && report) {
    const [y, m] = month.split('-').map(Number);
    const items = expenses.filter((e) => {
      if (monthKey(e.date) !== month || e.expense_category !== detail.cat) return false;
      return parseExpenseDate(e.date)?.getDate() === detail.day;
    });
    const dateLabel = new Date(y, m - 1, detail.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    popover = <Popover anchor={detail.anchor} cat={detail.cat} items={items} dateLabel={dateLabel} onClose={() => setDetail(null)} />;
  }

  return (
    <div className="card">
      <div className="report-header">
        <h3>Monthly report</h3>
        <span className="report-hint">{hint}</span>
      </div>
      <div className="report-scroll">{body}</div>
      {popover}
    </div>
  );
}
