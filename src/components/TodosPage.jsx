import React, { useMemo, useState } from 'react';
import { Pager, Toolbar } from './DataTableBits.jsx';
import { PencilIcon, TrashIcon } from './Icons.jsx';
import { usePager } from '../hooks/usePager.js';
import { displayDate, todayISO } from '../lib/format.js';

function statusOf(t, today) {
  if (t.done) return 'done';
  return t.task_date && String(t.task_date).slice(0, 10) < today ? 'overdue' : 'pending';
}

const TAGS = {
  done: ['fixed', 'Done'],
  overdue: ['variable', 'Overdue'],
  pending: ['neutral', 'Pending'],
};

export default function TodosPage({ todos, loaded, onAdd, onEdit, onDelete, onToggle, search: globalSearch }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const today = todayISO();

  const filtered = useMemo(() => {
    const q = `${globalSearch || ''} ${search}`.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return todos
      .filter((t) => (!status || statusOf(t, today) === status)
        && q.every((term) => `${t.title} ${t.details || ''}`.toLowerCase().includes(term)))
      // pending first by date (undated last), finished tasks at the bottom
      .sort((a, b) => Number(a.done) - Number(b.done)
        || String(a.task_date || '9999').localeCompare(String(b.task_date || '9999'))
        || a.id - b.id);
  }, [todos, status, search, globalSearch, today]);

  const pager = usePager(filtered, `${search}|${globalSearch}|${status}`);
  const open = todos.filter((t) => !t.done).length;

  return (
    <section className="page">
      <div className="page-header">
        <h1>To-Do</h1>
        <button className="add-btn" onClick={onAdd}>+ Add Task</button>
      </div>

      <div className="table-card">
        <Toolbar
          search={search}
          onSearch={setSearch}
          placeholder="Search tasks or details..."
          statusValue={status}
          onStatus={setStatus}
          statusOptions={[['', 'All tasks'], ['pending', 'Pending'], ['overdue', 'Overdue'], ['done', 'Done']]}
        />
        <div className="table-scroll">
          <table>
            <thead>
              <tr><th /><th>Task</th><th>Date</th><th>Status</th><th /></tr>
            </thead>
            <tbody>
              {pager.slice.length === 0 && (
                <tr className="empty-row"><td colSpan={5}>{loaded ? 'No tasks yet. Add your first one above.' : 'Loading tasks…'}</td></tr>
              )}
              {pager.slice.map((t) => {
                const s = statusOf(t, today);
                const [tone, label] = TAGS[s];
                return (
                  <tr key={t.id} className={t.done ? 'todo-done' : ''}>
                    <td className="todo-check-cell">
                      <input className="todo-check" type="checkbox" checked={t.done} aria-label={`Mark "${t.title}" as ${t.done ? 'not done' : 'done'}`} onChange={() => onToggle(t)} />
                    </td>
                    <td className="category">
                      <span className="cat-name">{t.title}</span>
                      {t.details && <span className="note">{t.details}</span>}
                    </td>
                    <td className="date">{t.task_date ? displayDate(t.task_date) : '—'}</td>
                    <td><span className={'tag ' + tone}>{label}</span></td>
                    <td className="actions">
                      <button className="del-btn" aria-label="Edit task" onClick={() => onEdit(t)}><PencilIcon width={15} height={15} /></button>
                      <button className="del-btn" aria-label="Delete task" onClick={() => onDelete(t)}><TrashIcon width={15} height={15} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pager pager={pager} noun="tasks" summary={`${open} open`} />
      </div>
    </section>
  );
}
