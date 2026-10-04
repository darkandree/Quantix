import React, { useEffect, useMemo, useRef, useState } from 'react';
import MonthSelect from './MonthSelect.jsx';
import { ColumnsIcon, PlusIcon, TrashIcon } from './Icons.jsx';
import { byNewest, displayDate, expensesForMonth, fmt, monthLabel } from '../lib/format.js';

const COLUMNS = [
  ['date', 'Date', false],
  ['category', 'Category', true],
  ['type', 'Type', true],
  ['amount', 'Amount', true],
];

export default function ExpensesPage({ expenses, month, onMonthChange, onAdd, onDelete }) {
  const [shown, setShown] = useState({ date: false, category: true, type: true, amount: true });
  const [panelOpen, setPanelOpen] = useState(false);
  const dropdown = useRef(null);

  useEffect(() => {
    if (!panelOpen) return undefined;
    const onDown = (e) => !dropdown.current?.contains(e.target) && setPanelOpen(false);
    const onKey = (e) => e.key === 'Escape' && setPanelOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [panelOpen]);

  const filtered = useMemo(() => [...expensesForMonth(expenses, month)].sort(byNewest), [expenses, month]);
  const total = filtered.reduce((s, e) => s + Number(e.amount || 0), 0);
  const hideClasses = COLUMNS.filter(([k]) => !shown[k]).map(([k]) => 'hide-col-' + k).join(' ');

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1>Expenses</h1>
          <p className="page-sub">All logged transactions</p>
        </div>
        <button className="add-btn" onClick={onAdd}><PlusIcon />Add expense</button>
      </div>

      <div className="header-controls toolbar-row">
        <MonthSelect expenses={expenses} value={month} onChange={onMonthChange} />
        <div className="columns-dropdown" ref={dropdown}>
          <button className="btn-ghost columns-btn" type="button" aria-haspopup="true" aria-expanded={panelOpen} onClick={() => setPanelOpen((o) => !o)}>
            <ColumnsIcon />Columns
          </button>
          {panelOpen && (
            <div className="columns-panel">
              {COLUMNS.map(([key, label]) => (
                <label className="columns-option" key={key}>
                  <input type="checkbox" checked={shown[key]} onChange={(e) => setShown((s) => ({ ...s, [key]: e.target.checked }))} /> {label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={'table-card ' + hideClasses} id="expensesTableCard">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th className="col-date">Date</th>
                <th className="col-category">Category</th>
                <th className="col-type">Type</th>
                <th className="num col-amount">Amount</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr className="empty-row">
                  <td colSpan={5}>No expenses {month === 'all' ? 'logged yet' : 'for ' + monthLabel(month)}.</td>
                </tr>
              )}
              {filtered.map((e) => {
                const fixed = e.expense_type === 'Fixed Expenses';
                const note = [e.product_name, e.remarks].filter(Boolean).join(' · ');
                return (
                  <tr key={e.id}>
                    <td className="date col-date">{displayDate(e.date)}</td>
                    <td className="category col-category">
                      <span className="cat-name">{e.expense_category}</span>
                      {note && <span className="note">{note}</span>}
                    </td>
                    <td className="col-type"><span className={'tag ' + (fixed ? 'fixed' : 'variable')}>{fixed ? 'Fixed' : 'Variable'}</span></td>
                    <td className="amount col-amount">{fmt(e.amount)}</td>
                    <td className="actions">
                      <button className="del-btn" aria-label="Delete expense" onClick={() => onDelete(e.id)}><TrashIcon width={15} height={15} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>Total</td>
                <td className="amount col-amount">{fmt(total)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
}
