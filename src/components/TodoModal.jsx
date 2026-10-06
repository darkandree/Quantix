import React, { useState } from 'react';
import Modal from './Modal.jsx';
import { todayISO } from '../lib/format.js';

export default function TodoModal({ todo, onSave, onClose }) {
  const [title, setTitle] = useState(todo?.title || '');
  const [details, setDetails] = useState(todo?.details || '');
  const [taskDate, setTaskDate] = useState(todo ? (todo.task_date ? String(todo.task_date).slice(0, 10) : '') : todayISO());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSave({ title: title.trim(), details: details.trim() || null, task_date: taskDate || null });
    } catch (err) {
      setError('Could not save task: ' + err.message);
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h2>{todo ? 'Edit task' : 'Add task'}</h2>
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="todoTitle">Task<span className="required-mark">*</span></label>
          <input id="todoTitle" type="text" required autoFocus placeholder="e.g. Pay electricity bill" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="todoDetails">Details (optional)</label>
          <textarea id="todoDetails" placeholder="Notes, account number, reference..." value={details} onChange={(e) => setDetails(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="todoDate">Date of task</label>
          <input id="todoDate" type="date" value={taskDate} onChange={(e) => setTaskDate(e.target.value)} />
        </div>
        <div className="error" style={{ display: error ? 'block' : 'none' }}>{error}</div>
        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : todo ? 'Update task' : 'Save task'}</button>
        </div>
      </form>
    </Modal>
  );
}
