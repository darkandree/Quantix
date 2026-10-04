import React, { useEffect, useMemo, useRef, useState } from 'react';
import MonthSelect from './MonthSelect.jsx';
import { AdvancedPanel, PanelField, Pager, Toolbar } from './DataTableBits.jsx';
import { TrashIcon } from './Icons.jsx';
import { usePager } from '../hooks/usePager.js';
import { byNewest, displayDate, fmt } from '../lib/format.js';
import { monthKey } from '../lib/format.js';

const COLUMNS = [['date', 'Date'], ['category', 'Category'], ['type', 'Type'], ['amount', 'Amount']];
const BLANK = { month: 'all', category: '', from: '', to: '', min: '', max: '' };

export default function ExpensesPage({ expenses, month, onMonthChange, onAdd, onDelete, search: globalSearch }) {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(BLANK);
  const [shown, setShown] = useState({ date: true, category: true, type: true, amount: true });
  const monthRef = useRef(month);

  // The month lives in App state; mirror it into the filter panel.
  useEffect(() => { setF((s) => ({ ...s, month })); monthRef.current = month; }, [month]);
  const set = (key) => (e) => {
    const value = e.target.value;
    if (key === 'month') onMonthChange(value);
    else setF((s) => ({ ...s, [key]: value }));
  };

  const categories = useMemo(() => [...new Set(expenses.map((e) => e.expense_category))].sort(), [expenses]);

  const filtered = useMemo(() => {
    const q = `${globalSearch || ''} ${search}`.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const min = f.min === '' ? null : Number(f.min);
    const max = f.max === '' ? null : Number(f.max);
    return expenses.filter((e) => {
      if (type && e.expense_type !== type) return false;
      if (f.month !== 'all' && monthKey(e.date) !== f.month) return false;
      if (f.category && e.expense_category !== f.category) return false;
      const day = String(e.date).slice(0, 10);
      if (f.from && day < f.from) return false;
      if (f.to && day > f.to) return false;
      if (min !== null && e.amount < min) return false;
      if (max !== null && e.amount > max) return false;
      const hay = [e.expense_category, e.product_name, e.remarks, e.expense_type, e.date].join(' ').toLowerCase();
      return q.every((term) => hay.includes(term));
    }).sort(byNewest);
  }, [expenses, f, type, search, globalSearch]);

  const pager = usePager(filtered, `${search}|${globalSearch}|${type}|${JSON.stringify(f)}`);
  const total = filtered.reduce((s, e) => s + Number(e.amount || 0), 0);
  const activeFilters = [f.month !== 'all', f.category, f.from, f.to, f.min !== '', f.max !== ''].filter(Boolean).length;
  const cols = Object.values(shown).filter(Boolean).length + 1;

  return (
    <section className="page">
      <div className="page-header">
        <h1>Expenses</h1>
        <button className="add-btn" onClick={onAdd}>+ Add Expense</button>
      </div>

      <div className="table-card">
        <Toolbar
          search={search}
          onSearch={setSearch}
          placeholder="Search category, product or remarks..."
          statusValue={type}
          onStatus={setType}
          statusOptions={[['', 'All types'], ['Fixed Expenses', 'Fixed'], ['Variable Expenses', 'Variable']]}
          activeFilters={activeFilters}
          open={open}
          onToggle={() => setOpen((o) => !o)}
        />
        {open && (
          <AdvancedPanel onReset={() => { setF(BLANK); onMonthChange('all'); }}>
            <PanelField label="Month"><MonthSelect expenses={expenses} value={f.month} onChange={(v) => onMonthChange(v)} /></PanelField>
            <PanelField label="Category">
              <select value={f.category} onChange={set('category')}>
                <option value="">All categories</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </PanelField>
            <PanelField label="Date from"><input type="date" value={f.from} onChange={set('from')} /></PanelField>
            <PanelField label="Date to"><input type="date" value={f.to} onChange={set('to')} /></PanelField>
            <PanelField label="Min amount"><input type="number" min="0" step="0.01" placeholder="0.00" value={f.min} onChange={set('min')} /></PanelField>
            <PanelField label="Max amount"><input type="number" min="0" step="0.01" placeholder="Any" value={f.max} onChange={set('max')} /></PanelField>
            <div className="dt-field wide">
              <span>Columns</span>
              <div className="dt-checks">
                {COLUMNS.map(([key, label]) => (
                  <label key={key}><input type="checkbox" checked={shown[key]} onChange={(e) => setShown((s) => ({ ...s, [key]: e.target.checked }))} /> {label}</label>
                ))}
              </div>
            </div>
          </AdvancedPanel>
        )}

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {shown.date && <th>Date</th>}
                {shown.category && <th>Category</th>}
                {shown.type && <th>Type</th>}
                {shown.amount && <th className="num">Amount</th>}
                <th />
              </tr>
            </thead>
            <tbody>
              {pager.slice.length === 0 && <tr className="empty-row"><td colSpan={cols}>No expenses match your filters.</td></tr>}
              {pager.slice.map((e) => {
                const fixed = e.expense_type === 'Fixed Expenses';
                const note = [e.product_name, e.remarks].filter(Boolean).join(' · ');
                return (
                  <tr key={e.id}>
                    {shown.date && <td className="date">{displayDate(e.date)}</td>}
                    {shown.category && (
                      <td className="category">
                        <span className="cat-name">{e.expense_category}</span>
                        {note && <span className="note">{note}</span>}
                      </td>
                    )}
                    {shown.type && <td><span className={'tag ' + (fixed ? 'fixed' : 'variable')}>{fixed ? 'Fixed' : 'Variable'}</span></td>}
                    {shown.amount && <td className="amount">{fmt(e.amount)}</td>}
                    <td className="actions">
                      <button className="del-btn" aria-label="Delete expense" onClick={() => onDelete(e.id)}><TrashIcon width={15} height={15} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pager pager={pager} noun="expenses" summary={`Total ${fmt(total)}`} />
      </div>
    </section>
  );
}