import React, { useMemo, useState } from 'react';
import { Pager, Toolbar } from './DataTableBits.jsx';
import { PencilIcon, TrashIcon } from './Icons.jsx';
import { usePager } from '../hooks/usePager.js';
import { displayDate } from '../lib/format.js';

export default function CategoriesPage({ rows, loaded, usage, onAdd, onEdit, onDelete, search: globalSearch }) {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');

  const filtered = useMemo(() => {
    const q = `${globalSearch || ''} ${search}`.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return rows
      .filter((r) => (!type || r.expense_type === type) && q.every((t) => r.expense_category.toLowerCase().includes(t)))
      .sort((a, b) => a.expense_type.localeCompare(b.expense_type) || a.expense_category.localeCompare(b.expense_category));
  }, [rows, type, search, globalSearch]);

  const pager = usePager(filtered, `${search}|${globalSearch}|${type}`);

  return (
    <section className="page">
      <div className="page-header">
        <h1>Expense Category</h1>
        <button className="add-btn" onClick={onAdd}>+ Add Category</button>
      </div>

      <div className="table-card">
        <Toolbar
          search={search}
          onSearch={setSearch}
          placeholder="Search category name..."
          statusValue={type}
          onStatus={setType}
          statusOptions={[['', 'All types'], ['Fixed Expenses', 'Fixed'], ['Variable Expenses', 'Variable']]}
        />
        <div className="table-scroll">
          <table>
            <thead>
              <tr><th>Category</th><th>Type</th><th>Due date</th><th className="num">Expenses logged</th><th /></tr>
            </thead>
            <tbody>
              {pager.slice.length === 0 && (
                <tr className="empty-row"><td colSpan={5}>{loaded ? 'No categories match your filters.' : 'Loading categories…'}</td></tr>
              )}
              {pager.slice.map((r) => {
                const fixed = r.expense_type === 'Fixed Expenses';
                return (
                  <tr key={r.id}>
                    <td className="category"><span className="cat-name">{r.expense_category}</span></td>
                    <td><span className={'tag ' + (fixed ? 'fixed' : 'variable')}>{fixed ? 'Fixed' : 'Variable'}</span></td>
                    <td className="date">{r.due_date ? displayDate(r.due_date) : '—'}</td>
                    <td className="amount">{usage[`${r.expense_type}|${r.expense_category}`] || 0}</td>
                    <td className="actions">
                      <button className="del-btn" aria-label="Edit category" onClick={() => onEdit(r)}><PencilIcon width={15} height={15} /></button>
                      <button className="del-btn" aria-label="Delete category" onClick={() => onDelete(r)}><TrashIcon width={15} height={15} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pager pager={pager} noun="categories" />
      </div>
    </section>
  );
}
