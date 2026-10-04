import React, { useCallback, useEffect, useRef, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import Dashboard from './components/Dashboard.jsx';
import ExpensesPage from './components/ExpensesPage.jsx';
import ProductsPage from './components/ProductsPage.jsx';
import UsersPage from './components/UsersPage.jsx';
import ExpenseModal from './components/ExpenseModal.jsx';
import ProductModal from './components/ProductModal.jsx';
import ProfileModal from './components/ProfileModal.jsx';
import LoginPage from './components/LoginPage.jsx';
import { ConfirmModal } from './components/Modal.jsx';
import Toasts from './components/Toasts.jsx';
import { CloseIcon, MenuIcon } from './components/Icons.jsx';
import * as api from './lib/api.js';
import { isConfigured, supabase } from './lib/supabase.js';
import { currentMonthKey } from './lib/format.js';

const FALLBACK_CATEGORIES = {
  'Variable Expenses': ['Laundry', 'Fuel', 'Groceries', 'Food Order', 'Online', 'Credit Card - BDO JCB Lucky Cat', 'Credit Card - Shop More', 'Credit Card - Eastwest', 'Unit Transfer Expenses', 'Miscellaneous'],
  'Fixed Expenses': ['Monthly Rental', 'Water', 'Electricity', 'Internet'],
};

let toastSeq = 0;

function Splash({ text, hide }) {
  return (
    <div className={'splash' + (hide ? ' hide' : '')}>
      <div className="splash-inner">
        <img src="/logo.png" alt="Logo" className="splash-logo" />
        <div className="splash-name">Expense Ledger</div>
        <div className="splash-spinner" />
        <div className="splash-status">{text}</div>
      </div>
    </div>
  );
}

// Everything the signed-in, Active user sees.
function Shell({ profile, onProfileChange, theme, onToggleTheme }) {
  const [page, setPage] = useState('dashboard');
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [expenses, setExpenses] = useState([]);
  const [products, setProducts] = useState([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [sync, setSync] = useState('Connecting…');
  const [splash, setSplash] = useState({ visible: true, hide: false, text: 'Syncing with Supabase…' });
  const [dashMonth, setDashMonth] = useState(currentMonthKey());
  const [tableMonth, setTableMonth] = useState('all');

  const [expenseModal, setExpenseModal] = useState(null); // null = closed, {} = new, expense row = editing
  const [productModal, setProductModal] = useState(false);
  const [profileModal, setProfileModal] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null); // { kind, id }
  const [toasts, setToasts] = useState([]);

  const productsPromise = useRef(null);

  const toast = useCallback((message, type = 'success', duration = 3000) => {
    setToasts((t) => [...t, { id: ++toastSeq, message, type, duration }]);
  }, []);
  const dropToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setSync('Syncing…');
      const [cats, exps] = await Promise.allSettled([api.fetchCategories(), api.fetchExpenses()]);
      if (cancelled) return;
      if (cats.status === 'fulfilled' && Object.values(cats.value).some((l) => l.length)) setCategories(cats.value);
      const ok = exps.status === 'fulfilled';
      if (ok) setExpenses(exps.value);
      else console.error(exps.reason);
      setSync(ok ? 'Live · synced with Supabase' : 'Could not reach Supabase');
      setSplash((s) => ({ ...s, text: ok ? 'Synced!' : "Couldn't sync — showing what's available" }));
      setTimeout(() => setSplash((s) => ({ ...s, hide: true })), 250);
      setTimeout(() => setSplash((s) => ({ ...s, visible: false })), 650);
    })();
    return () => { cancelled = true; };
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      const rows = await api.fetchProducts();
      setProducts(rows);
      setProductsLoaded(true);
      return rows;
    } catch (err) {
      console.error(err);
      toast('Could not load products: ' + err.message, 'error');
      return [];
    }
  }, [toast]);

  // Resolves with the products list, fetching it once on first use.
  const ensureProducts = useCallback(() => {
    if (productsLoaded) return Promise.resolve(products);
    productsPromise.current = productsPromise.current || loadProducts().finally(() => { productsPromise.current = null; });
    return productsPromise.current;
  }, [productsLoaded, products, loadProducts]);

  async function loadUsers() {
    try {
      setUsers(await api.fetchProfiles());
      setUsersLoaded(true);
    } catch (err) {
      toast('Could not load users: ' + err.message, 'error');
    }
  }

  function navigate(next) {
    setPage(next);
    setMobileOpen(false);
    if (next === 'products' && !productsLoaded) ensureProducts();
    if (next === 'users' && !usersLoaded) loadUsers();
  }

  function onSearch(value) {
    setSearch(value);
    if (value && page === 'dashboard') navigate('expenses');
  }

  async function saveExpense(payload) {
    if (expenseModal?.id) {
      const row = await api.updateExpense(expenseModal.id, payload);
      setExpenses((list) => list.map((e) => (e.id === row.id ? row : e)));
      toast('Expense updated', 'success');
    } else {
      const row = await api.addExpense(payload);
      setExpenses((list) => [row, ...list]);
      toast('Expense added successfully', 'success');
    }
    setExpenseModal(null);
  }

  async function saveProduct(payload) {
    const row = await api.addProduct(payload);
    setProducts((list) => [row, ...list]);
    setProductsLoaded(true);
    setProductModal(false);
    toast('Product added successfully', 'success');
  }

  function profileSaved(row) {
    onProfileChange(row);
    setUsers((list) => list.map((u) => (u.id === row.id ? row : u)));
    setProfileModal(false);
    toast('Profile updated', 'success');
  }

  async function confirmDelete() {
    const { kind, id } = pendingDelete;
    setPendingDelete(null);
    const isExpense = kind === 'expense';
    const [list, setList, remove] = isExpense ? [expenses, setExpenses, api.deleteExpense] : [products, setProducts, api.deleteProduct];
    setList(list.filter((r) => r.id !== id)); // optimistic
    try {
      await remove(id);
      toast(`${isExpense ? 'Expense' : 'Product'} deleted`, 'delete');
    } catch (err) {
      setList(list);
      toast('Could not delete from Supabase: ' + err.message, 'error');
    }
  }

  return (
    <>
      {splash.visible && <Splash text={splash.text} hide={splash.hide} />}

      <button className="mobile-menu-btn" aria-label="Open navigation" type="button" onClick={() => setMobileOpen((o) => !o)}>
        {mobileOpen ? <CloseIcon /> : <MenuIcon />}
      </button>
      <div className={'sidebar-backdrop' + (mobileOpen ? ' show' : '')} onClick={() => setMobileOpen(false)} />

      <div className="app">
        <Sidebar
          page={page}
          onNavigate={navigate}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          mobileOpen={mobileOpen}
          syncText={sync}
        />
        <div className="main-col">
          <Topbar
            search={search}
            onSearch={onSearch}
            theme={theme}
            onToggleTheme={onToggleTheme}
            profile={profile}
            onEditProfile={() => setProfileModal(true)}
            onSignOut={() => supabase.auth.signOut()}
          />
          <main className="content">
            {page === 'dashboard' && <Dashboard expenses={expenses} month={dashMonth} onMonthChange={setDashMonth} />}
            {page === 'expenses' && (
              <ExpensesPage
                expenses={expenses}
                month={tableMonth}
                onMonthChange={setTableMonth}
                search={search}
                onAdd={() => setExpenseModal({})}
                onEdit={(expense) => setExpenseModal(expense)}
                onDelete={(id) => setPendingDelete({ kind: 'expense', id })}
              />
            )}
            {page === 'products' && (
              <ProductsPage
                products={products}
                loaded={productsLoaded}
                search={search}
                onAdd={() => setProductModal(true)}
                onDelete={(id) => setPendingDelete({ kind: 'product', id })}
              />
            )}
            {page === 'users' && <UsersPage users={users} loaded={usersLoaded} me={profile.id} search={search} />}
          </main>
        </div>
      </div>

      {expenseModal && (
        <ExpenseModal expense={expenseModal.id ? expenseModal : null} categories={categories} ensureProducts={ensureProducts} onSave={saveExpense} onClose={() => setExpenseModal(null)} />
      )}
      {productModal && <ProductModal onSave={saveProduct} onClose={() => setProductModal(false)} />}
      {profileModal && <ProfileModal profile={profile} onSaved={profileSaved} onClose={() => setProfileModal(false)} />}
      {pendingDelete && <ConfirmModal label={pendingDelete.kind} onCancel={() => setPendingDelete(null)} onConfirm={confirmDelete} />}
      <Toasts toasts={toasts} onDone={dropToast} />
    </>
  );
}

// Loads the signed-in user's profile and only lets Active users through.
function Gate({ session, theme, onToggleTheme }) {
  const [profile, setProfile] = useState(undefined); // undefined = loading, null = missing
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.fetchProfile(session.user.id)
      .then((p) => !cancelled && setProfile(p))
      .catch((err) => { if (!cancelled) { setError(err.message); setProfile(null); } });
    return () => { cancelled = true; };
  }, [session.user.id]);

  if (profile === undefined) return <Splash text="Signing you in…" />;

  if (!profile || profile.status !== 'Active') {
    return (
      <div className="login-wrap">
        <div className="login-card">
          <h1>{profile ? 'Account inactive' : 'Profile not found'}</h1>
          <p className="page-sub">
            {profile
              ? 'Your account has been deactivated. Contact an administrator to regain access.'
              : error || 'No profile exists for this account yet. Run supabase/auth.sql, then sign in again.'}
          </p>
          <button className="btn-primary login-btn" onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </div>
    );
  }

  return <Shell profile={profile} onProfileChange={setProfile} theme={theme} onToggleTheme={onToggleTheme} />;
}

export default function App() {
  const [theme, setTheme] = useState(() => (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  const [session, setSession] = useState(undefined); // undefined = still checking

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);

  useEffect(() => {
    if (!isConfigured) { setSession(null); return undefined; }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!isConfigured) {
    return (
      <div className="login-wrap">
        <div className="login-card">
          <h1>Supabase isn't configured</h1>
          <p className="page-sub">Copy <code>.env.example</code> to <code>.env</code>, fill in your project URL and anon key, then restart the dev server.</p>
        </div>
      </div>
    );
  }
  if (session === undefined) return <Splash text="Loading…" />;
  if (!session) return <LoginPage theme={theme} />;
  return <Gate session={session} theme={theme} onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} />;
}
