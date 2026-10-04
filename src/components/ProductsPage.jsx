import React, { useMemo, useState } from 'react';
import { AdvancedPanel, PanelField, Pager, Toolbar } from './DataTableBits.jsx';
import { TrashIcon } from './Icons.jsx';
import { usePager } from '../hooks/usePager.js';
import { fmt } from '../lib/format.js';

const BLANK = { min: '', max: '', barcode: '' };

export default function ProductsPage({ products, loaded, onAdd, onDelete, search: globalSearch }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(BLANK);
  const set = (key) => (e) => setF((s) => ({ ...s, [key]: e.target.value }));

  const filtered = useMemo(() => {
    const q = `${globalSearch || ''} ${search}`.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const min = f.min === '' ? null : Number(f.min);
    const max = f.max === '' ? null : Number(f.max);
    return products.filter((p) => {
      if (status && String(p.status).toLowerCase() !== status) return false;
      if (f.barcode === 'with' && !p.barcode) return false;
      if (f.barcode === 'without' && p.barcode) return false;
      if (min !== null && p.price < min) return false;
      if (max !== null && p.price > max) return false;
      const hay = `${p.product_name} ${p.barcode || ''}`.toLowerCase();
      return q.every((term) => hay.includes(term));
    });
  }, [products, f, status, search, globalSearch]);

  const pager = usePager(filtered, `${search}|${globalSearch}|${status}|${JSON.stringify(f)}`);
  const activeFilters = [f.min !== '', f.max !== '', f.barcode].filter(Boolean).length;

  return (
    <section className="page">
      <div className="page-header">
        <h1>Products</h1>
        <button className="add-btn" onClick={onAdd}>+ Add Product</button>
      </div>

      <div className="table-card">
        <Toolbar
          search={search}
          onSearch={setSearch}
          placeholder="Search product name or barcode..."
          statusValue={status}
          onStatus={setStatus}
          statusOptions={[['', 'All status'], ['active', 'Active'], ['inactive', 'Inactive']]}
          activeFilters={activeFilters}
          open={open}
          onToggle={() => setOpen((o) => !o)}
        />
        {open && (
          <AdvancedPanel onReset={() => setF(BLANK)}>
            <PanelField label="Min price"><input type="number" min="0" step="0.01" placeholder="0.00" value={f.min} onChange={set('min')} /></PanelField>
            <PanelField label="Max price"><input type="number" min="0" step="0.01" placeholder="Any" value={f.max} onChange={set('max')} /></PanelField>
            <PanelField label="Barcode">
              <select value={f.barcode} onChange={set('barcode')}>
                <option value="">Any</option>
                <option value="with">Has barcode</option>
                <option value="without">No barcode</option>
              </select>
            </PanelField>
          </AdvancedPanel>
        )}

        <div className="table-scroll">
          <table>
            <thead>
              <tr><th>Barcode</th><th>Product</th><th className="num">Price</th><th>Status</th><th /></tr>
            </thead>
            <tbody>
              {pager.slice.length === 0 && (
                <tr className="empty-row"><td colSpan={5}>{loaded ? 'No products match your filters.' : 'Loading products…'}</td></tr>
              )}
              {pager.slice.map((p) => {
                const active = String(p.status).toLowerCase() === 'active';
                return (
                  <tr key={p.id}>
                    <td className="date">{p.barcode || '—'}</td>
                    <td className="category"><span className="cat-name">{p.product_name}</span></td>
                    <td className="amount">{fmt(p.price)}</td>
                    <td><span className={'tag ' + (active ? 'fixed' : 'variable')}>{p.status}</span></td>
                    <td className="actions">
                      <button className="del-btn" aria-label="Delete product" onClick={() => onDelete(p.id)}><TrashIcon width={15} height={15} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pager pager={pager} noun="products" />
      </div>
    </section>
  );
}