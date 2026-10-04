import React, { useState } from 'react';
import Modal from './Modal.jsx';
import BarcodeField from './BarcodeField.jsx';
import { useScanner } from '../hooks/useScanner.js';

export default function ProductModal({ onSave, onClose }) {
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const scanner = useScanner((text) => { setBarcode(text); scanner.setHint('Captured: ' + text); });

  async function submit(e) {
    e.preventDefault();
    setError('');
    const value = parseFloat(price);
    if (!value || value < 0) { setError('Enter a valid price.'); return; }
    setSaving(true);
    try {
      await onSave({ barcode: barcode.trim() || null, product_name: name.trim(), price: value, status: 'Active' });
    } catch (err) {
      setError('Could not save to Supabase: ' + err.message);
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h2>Add product</h2>
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="barcodeInput">Barcode (optional)</label>
          <BarcodeField id="barcodeInput" value={barcode} onChange={setBarcode} placeholder="Scan or type barcode (optional)" scanner={scanner} />
        </div>
        <div className="field">
          <label htmlFor="productNameInput">Product name<span className="required-mark">*</span></label>
          <input type="text" id="productNameInput" placeholder="e.g. Bear Brand 300ml" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="priceInput">Price (₱)<span className="required-mark">*</span></label>
          <input type="number" id="priceInput" min="0" step="0.01" placeholder="0.00" required value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="field">
          <label>Status</label>
          <span className="tag fixed">Active</span>
          <div className="hint-text">New products are saved as Active by default.</div>
        </div>
        <div className="error" style={{ display: error ? 'block' : 'none' }}>{error}</div>
        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save product'}</button>
        </div>
      </form>
    </Modal>
  );
}
