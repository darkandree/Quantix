import React from 'react';
import { PlusIcon, TrashIcon } from './Icons.jsx';
import { fmt } from '../lib/format.js';

export default function ProductsPage({ products: all, loaded, onAdd, onDelete, search }) {
  const q = (search || '').trim().toLowerCase();
  const products = q
    ? all.filter((p) => [p.product_name, p.barcode].some((v) => String(v || '').toLowerCase().includes(q)))
    : all;
  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1>Products</h1>
          <p className="page-sub">Barcode-linked product catalog</p>
        </div>
        <button className="add-btn" onClick={onAdd}><PlusIcon />Add product</button>
      </div>
      <div className="table-card">
        <table>
          <thead>
            <tr><th>Barcode</th><th>Product</th><th className="num">Price</th><th>Status</th><th /></tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr className="empty-row"><td colSpan={5}>{loaded ? 'No products yet. Add your first one above.' : 'Loading products…'}</td></tr>
            )}
            {products.map((p) => {
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
    </section>
  );
}
