import React from 'react';

export function Toolbar({ search, onSearch, placeholder, statusValue, onStatus, statusOptions, activeFilters, open, onToggle, extra }) {
  return (
    <div className="dt-toolbar">
      <input className="dt-search" type="search" placeholder={placeholder} value={search} onChange={(e) => onSearch(e.target.value)} />
      <select className="dt-select" value={statusValue} onChange={(e) => onStatus(e.target.value)}>
        {statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <button type="button" className={'dt-btn' + (open ? ' on' : '')} aria-expanded={open} onClick={onToggle}>
        Advanced Filter{activeFilters > 0 && <span className="dt-badge">{activeFilters}</span>}
      </button>
      {extra}
    </div>
  );
}

export function AdvancedPanel({ children, onReset }) {
  return (
    <div className="dt-panel">
      <div className="dt-panel-grid">{children}</div>
      <div className="dt-panel-actions">
        <button type="button" className="dt-btn" onClick={onReset}>Reset filters</button>
      </div>
    </div>
  );
}

export const PanelField = ({ label, children }) => (
  <label className="dt-field"><span>{label}</span>{children}</label>
);

function pageList(page, count) {
  const set = new Set([1, count, page - 1, page, page + 1]);
  const nums = [...set].filter((n) => n >= 1 && n <= count).sort((a, b) => a - b);
  const out = [];
  nums.forEach((n, i) => {
    if (i && n - nums[i - 1] > 1) out.push('gap' + n);
    out.push(n);
  });
  return out;
}

export function Pager({ pager, noun = 'results', summary }) {
  const { page, setPage, pageCount, size, setSize, total, from, to } = pager;
  return (
    <div className="dt-footer">
      <span>Showing {from}–{to} of {total} {noun}{summary ? <> · <strong>{summary}</strong></> : null}</span>
      <div className="dt-pager">
        <select className="dt-select sm" aria-label="Rows per page" value={size} onChange={(e) => setSize(Number(e.target.value))}>
          {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
        </select>
        <button type="button" className="dt-page" disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Previous page">‹</button>
        {pageList(page, pageCount).map((n) => (typeof n === 'string'
          ? <span key={n} className="dt-gap">…</span>
          : <button key={n} type="button" className={'dt-page' + (n === page ? ' on' : '')} onClick={() => setPage(n)}>{n}</button>))}
        <button type="button" className="dt-page" disabled={page === pageCount} onClick={() => setPage(page + 1)} aria-label="Next page">›</button>
      </div>
    </div>
  );
}