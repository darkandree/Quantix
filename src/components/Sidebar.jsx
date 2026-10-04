import React from 'react';
import { ChevronLeft, DashboardIcon, ExpensesIcon, MoonIcon, ProductsIcon, SunIcon } from './Icons.jsx';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', Icon: DashboardIcon },
  { id: 'expenses', label: 'Expenses', Icon: ExpensesIcon },
  { id: 'products', label: 'Products', Icon: ProductsIcon },
];

export default function Sidebar({ page, onNavigate, collapsed, onToggleCollapse, mobileOpen, syncText, theme, onToggleTheme }) {
  return (
    <aside className={'sidebar' + (collapsed ? ' collapsed' : '') + (mobileOpen ? ' mobile-open' : '')}>
      <button className="collapse-btn" aria-label="Collapse sidebar" type="button" onClick={onToggleCollapse}>
        <ChevronLeft />
      </button>
      <div className="brand">
        <div className="brand-left">
          <div className="brand-mark"><img src="/logo.png" alt="Logo" /></div>
          <div className="brand-name">Expense Ledger</div>
        </div>
      </div>
      <nav className="nav">
        {NAV.map(({ id, label, Icon }) => (
          <button key={id} type="button" className={'nav-item' + (page === id ? ' active' : '')} onClick={() => onNavigate(id)}>
            <Icon />
            <span className="nav-label">{label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <span className="sync-pill">{syncText}</span>
        <button className="theme-btn" aria-label="Toggle dark mode" type="button" onClick={onToggleTheme}>
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </aside>
  );
}
