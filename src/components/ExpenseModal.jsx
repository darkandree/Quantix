import React, { useState } from 'react';
import Modal from './Modal.jsx';
import BarcodeField from './BarcodeField.jsx';
import { CloseIcon, LockIcon, SaveIcon, TrendIcon } from './Icons.jsx';
import { useScanner } from '../hooks/useScanner.js';
import { fmt, todayISO } from '../lib/format.js';

export default function ExpenseModal({ expense, categories, ensureProducts, onSave, onClose }) {
  const [type, setType] = useState(expense?.expense_type || 'Variable Expenses');
  const [category, setCategory] = useState(expense?.expense_category || '');
  const [date, setDate] = useState(expense ? String(expense.date).slice(0, 10) : todayISO());
  const [barcode, setBarcode] = useState('');
  const [amount, setAmount] = useState(expense ? String(expense.amount) : '');
  const [product, setProduct] = useState(expense?.product_name || '');
  const [note, setNote] = useState(expense?.remarks || '');
  const [barcodeHint, setBarcodeHint] = useState(null); // { text, matched }
  const [amountError, setAmountError] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function lookup(code) {
    const trimmed = String(code || '').trim();
    if (!trimmed) { setBarcodeHint(null); return; }
    const list = await ensureProducts();
    const match = list.find((p) => String(p.barcode).trim() === trimmed);
    if (match) {
      setProduct(match.product_name);
      setAmount(String(match.price));
      setAmountError(false);
      setBarcodeHint({ matched: true, text: `Matched: ${match.product_name} · ${fmt(match.price)}` });
    } else {
      setBarcodeHint({ matched: false, text: `No product found for barcode "${trimmed}" — enter details manually.` });
    }
  }

  const scanner = useScanner((text) => { setBarcode(text); lookup(text); });
  const options = new Set(categories[type] || []);
  if (expense && expense.expense_type === type) options.add(expense.expense_category); // keep a category that was since removed
  const sortedCategories = [...options].sort((a, b) => a.localeCompare(b));

  function changeType(next) {
    setType(next);
    setCategory('');
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    const value = parseFloat(amount);
    if (!value || value <= 0) { setAmountError(true); return; }
    setAmountError(false);
    setSaving(true);
    try {
      await onSave({
        expense_type: type,
        expense_category: category,
        date,
        amount: value,
        product_name: product.trim() || null,
        remarks: note.trim() || null,
      });
    } catch (err) {
      setError('Could not save to Supabase: ' + err.message);
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h2>{expense ? 'Edit expense' : 'Add expense'}</h2>
      <form onSubmit={submit}>
        <div className="field">
          <label>Type<span className="required-mark">*</span></label>
          <div className="type-toggle">
            <button type="button" className={'variable' + (type === 'Variable Expenses' ? ' active' : '')} onClick={() => changeType('Variable Expenses')}>
              <TrendIcon />Variable
            </button>
            <button type="button" className={'fixed' + (type === 'Fixed Expenses' ? ' active' : '')} onClick={() => changeType('Fixed Expenses')}>
              <LockIcon />Fixed
            </button>
          </div>
        </div>
        <div className="field">
          <label htmlFor="categorySelect">Category<span className="required-mark">*</span></label>
          <select id="categorySelect" required autoFocus value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="" disabled>Select category</option>
            {sortedCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="dateInput">Date<span className="required-mark">*</span></label>
          <input type="date" id="dateInput" required value={date} onChange={(e) => setDate(e.target.value)} />
        </div>        <div className="field">
          <label htmlFor="expenseBarcodeInput">Scan barcode (optional)</label>
          <BarcodeField
            id="expenseBarcodeInput"
            value={barcode}
            onChange={setBarcode}
            onCommit={lookup}
            placeholder="Scan or type to auto-fill product & amount"
            scanner={scanner}
          />
          {barcodeHint && (
            <div className="hint-text" style={{ color: barcodeHint.matched ? 'var(--fixed)' : 'var(--danger)' }}>{barcodeHint.text}</div>
          )}
        </div>
        <div className="field">
          <label htmlFor="amountInput">Amount (₱)<span className="required-mark">*</span></label>
          <input type="number" id="amountInput" min="0" step="0.01" placeholder="0.00" required value={amount} onChange={(e) => setAmount(e.target.value)} />
          <div className="error" style={{ display: amountError ? 'block' : 'none' }}>Enter an amount greater than zero.</div>
        </div>
        <div className="field">
          <label htmlFor="productInput">Product / item (optional)</label>
          <input type="text" id="productInput" placeholder="e.g. Meralco bill" value={product} onChange={(e) => setProduct(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="noteInput">Remarks (optional)</label>
          <input type="text" id="noteInput" placeholder="e.g. weekly grocery run" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="error" style={{ display: error ? 'block' : 'none' }}>{error}</div>
        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}><CloseIcon width={15} height={15} />Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}><SaveIcon />{saving ? 'Saving…' : expense ? 'Update expense' : 'Save expense'}</button>
        </div>
      </form>
    </Modal>
  );
}
