import React from 'react';
import { ChevronLeft, PackageIcon, PieIcon, ReceiptIcon, UsersIcon } from './Icons.jsx';

const GROUPS = [
  { items: [{ id: 'dashboard', label: 'Dashboard', Icon: PieIcon }] },
  { title: 'General', items: [
    { id: 'expenses', label: 'Expenses', Icon: ReceiptIcon },
    { id: 'products', label: 'Products', Icon: PackageIcon },
  ] },
  { title: 'Admin', items: [{ id: 'users', label: 'Users', Icon: UsersIcon }] },
];

export default function Sidebar({ page, onNavigate, collapsed, onToggleCollapse, mobileOpen, syncText }) {
  return (
    <aside className={'sidebar' + (collapsed ? ' collapsed' : '') + (mobileOpen ? ' mobile-open' : '')}>
      <button className="collapse-btn" aria-label="Collapse sidebar" type="button" onClick={onToggleCollapse}>
        <ChevronLeft />
      </button>
      <div className="brand">
        <div className="brand-left">
          <div className="brand-mark"><img src="/logo.png" alt="Logo" /></div>
          <div className="brand-text">
            <div className="brand-name">Expense Ledger</div>
            <div className="brand-sub">Expense Monitoring</div>
          </div>
        </div>
      </div>
      <nav className="nav">
        {GROUPS.map((g, i) => (
          <div className="nav-group" key={i}>
            {g.title && <div className="nav-heading">{g.title}</div>}
            {g.items.map(({ id, label, Icon }) => (
              <button key={id} type="button" className={'nav-item' + (page === id ? ' active' : '')} onClick={() => onNavigate(id)}>
                <Icon />
                <span className="nav-label">{label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <span className="sync-pill">{syncText}</span>
      </div>
    </aside>
  );
}