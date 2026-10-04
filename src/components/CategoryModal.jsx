import React, { useState } from 'react';
import Modal from './Modal.jsx';
import { LockIcon, TrendIcon } from './Icons.jsx';

export default function CategoryModal({ category, onSave, onClose }) {
  const [type, setType] = useState(category?.expense_type || 'Variable Expenses');
  const [name, setName] = useState(category?.expense_category || '');
  const [dueDate, setDueDate] = useState(category?.due_date ? String(category.due_date).slice(0, 10) : '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { expense_type: type, expense_category: name.trim() };
      // Only send due_date when set or being cleared, so saves still work before the column exists.
      if (dueDate || category?.due_date) payload.due_date = dueDate || null;
      await onSave(payload);
    } catch (err) {
      setError(/duplicate|unique/i.test(err.message) ? 'That category already exists for this type.' : 'Could not save: ' + err.message);
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h2>{category ? 'Edit category' : 'Add category'}</h2>
      <form onSubmit={submit}>
        <div className="field">
          <label>Type<span className="required-mark">*</span></label>
          <div className="type-toggle">
            <button type="button" className={'variable' + (type === 'Variable Expenses' ? ' active' : '')} onClick={() => setType('Variable Expenses')}>
              <TrendIcon />Variable
            </button>
            <button type="button" className={'fixed' + (type === 'Fixed Expenses' ? ' active' : '')} onClick={() => setType('Fixed Expenses')}>
              <LockIcon />Fixed
            </button>
          </div>
        </div>
        <div className="field">
          <label htmlFor="categoryNameInput">Category name<span className="required-mark">*</span></label>
          <input id="categoryNameInput" type="text" required autoFocus placeholder="e.g. Insurance" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="categoryDueInput">Due date (optional)</label>
          <input id="categoryDueInput" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        {category && (
          <div className="hint-text">Renaming also updates every existing expense that uses “{category.expense_category}”.</div>
        )}
        <div className="error" style={{ display: error ? 'block' : 'none' }}>{error}</div>
        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : category ? 'Update category' : 'Save category'}</button>
        </div>
      </form>
    </Modal>
  );
}
