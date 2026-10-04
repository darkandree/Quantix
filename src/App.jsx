import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import Dashboard from './components/Dashboard.jsx';
import ExpensesPage from './components/ExpensesPage.jsx';
import ProductsPage from './components/ProductsPage.jsx';
import UsersPage from './components/UsersPage.jsx';
import CategoriesPage from './components/CategoriesPage.jsx';
import CategoryModal from './components/CategoryModal.jsx';
import ExpenseModal from './components/ExpenseModal.jsx';
import ProductModal from './components/ProductModal.jsx';
import ProfileModal from './components/ProfileModal.jsx';
import LoginPage from './components/LoginPage.jsx';
import { ConfirmModal } from './components/Modal.jsx';
import Toasts from './components/Toasts.jsx';
import { CloseIcon, MenuIcon } from './components/Icons.jsx';
import * as api from './lib/api.js';
import { isConfigured, supabase } from './lib/supabase.js';
import { byNewest, currentMonthKey, displayDate, fmt } from './lib/format.js';

const FALLBACK_CATEGORIES = {
  'Variable Expenses': ['Laundry', 'Fuel', 'Groceries', 'Food Order', 'Online', 'Credit Card - BDO JCB Lucky Cat', 'Credit Card - Shop More', 'Credit Card - Eastwest', 'Unit Transfer Expenses', 'Miscellaneous'],
  'Fixed Expenses': ['Monthly Rental', 'Water', 'Electricity', 'Internet'],
};

let toastSeq = 0;

// Plain backdrop shown for the instant while the session/profile is being checked.
const Blank = () => <div className="login-wrap" />;

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
  const [categoryRows, setCategoryRows] = useState([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [categoryModal, setCategoryModal] = useState(null); // null = closed, {} = new, row = editing
  const categories = useMemo(() => {
    if (!categoriesLoaded) return FALLBACK_CATEGORIES;
    const grouped = { 'Variable Expenses': [], 'Fixed Expenses': [] };
    categoryRows.forEach((r) => grouped[r.expense_type]?.push(r.expense_category));
    return grouped;
  }, [categoryRows, categoriesLoaded]);
  const categoryUsage = useMemo(() => {
    const counts = {};
    expenses.forEach((e) => { const k = `${e.expense_type}|${e.expense_category}`; counts[k] = (counts[k] || 0) + 1; });
    return counts;
  }, [expenses]);
  const [sync, setSync] = useState('Connecting…');
  const [signOutConfirm, setSignOutConfirm] = useState(false);
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
      const [cats, exps] = await Promise.allSettled([api.fetchCategoryRows(), api.fetchExpenses()]);
      if (cancelled) return;
      if (cats.status === 'fulfilled') { setCategoryRows(cats.value); setCategoriesLoaded(true); }
      const ok = exps.status === 'fulfilled';
      if (ok) setExpenses(exps.value);
      else console.error(exps.reason);
      setSync(ok ? 'Live · synced with Supabase' : 'Could not reach Supabase');
      if (!ok) toast("Couldn't load your data from Supabase.", 'error', 5000);
    })();
    return () => { cancelled = true; };
  }, [toast]);

  // Right after signing in, confirm it with a toast (not on a plain page refresh).
  useEffect(() => {
    try {
      if (sessionStorage.getItem('justSignedIn')) {
        sessionStorage.removeItem('justSignedIn');
        toast('Signed in successfully.', 'success');
      }
    } catch { /* storage unavailable */ }
  }, [toast]);

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

  // Make sure everything searchable has been loaded once the search box is used.
  function onSearchFocus() {
    if (!productsLoaded) ensureProducts();
    if (!usersLoaded) loadUsers();
  }

  const searchGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    const terms = q.split(/\s+/);
    const matches = (...values) => {
      const hay = values.filter(Boolean).join(' ').toLowerCase();
      return terms.every((t) => hay.includes(t));
    };
    const go = (nextPage, term, extra) => () => {
      if (extra) extra();
      setSearch(term);
      navigate(nextPage);
    };
    const LIMIT = 5;
    const groups = [];

    const pages = [['dashboard', 'Dashboard'], ['expenses', 'Expenses'], ['products', 'Products'], ['categories', 'Expense Category'], ['users', 'Users']]
      .filter(([, label]) => matches(label))
      .map(([id, label]) => ({ key: 'page-' + id, title: label, sub: 'Go to page', pick: go(id, '') }));
    if (pages.length) groups.push({ title: 'Pages', items: pages });

    const cats = [...new Set([...expenses.map((e) => e.expense_category), ...Object.values(categories).flat()])]
      .filter((c) => matches(c)).sort((a, b) => a.localeCompare(b)).slice(0, LIMIT)
      .map((c) => ({ key: 'cat-' + c, title: c, sub: 'Category', pick: go('expenses', c, () => setTableMonth('all')) }));
    if (cats.length) groups.push({ title: 'Categories', items: cats });

    const exps = expenses
      .filter((e) => matches(e.expense_category, e.product_name, e.remarks, e.expense_type))
      .sort(byNewest).slice(0, LIMIT)
      .map((e) => ({
        key: 'exp-' + e.id,
        title: e.expense_category,
        sub: [e.product_name, e.remarks, displayDate(e.date)].filter(Boolean).join(' · '),
        right: fmt(e.amount),
        pick: go('expenses', [e.expense_category, e.product_name].filter(Boolean).join(' '), () => setTableMonth('all')),
      }));
    if (exps.length) groups.push({ title: 'Expenses', items: exps });

    const prods = products.filter((p) => matches(p.product_name, p.barcode)).slice(0, LIMIT)
      .map((p) => ({ key: 'prod-' + p.id, title: p.product_name, sub: p.barcode || 'No barcode', right: fmt(p.price), pick: go('products', p.product_name) }));
    if (prods.length) groups.push({ title: 'Products', items: prods });

    const people = users.filter((u) => matches(u.full_name, u.email)).slice(0, LIMIT)
      .map((u) => ({ key: 'user-' + u.id, title: u.full_name || u.email, sub: u.email, right: u.status, pick: go('users', u.email) }));
    if (people.length) groups.push({ title: 'Users', items: people });

    return groups;
  // navigate only calls stable setters and loaders, so it is safe to omit.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, expenses, products, users, categories]);

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

  async function saveCategory(payload) {
    if (categoryModal?.id) {
      const row = await api.updateCategory(categoryModal, payload);
      setCategoryRows((list) => list.map((r) => (r.id === row.id ? row : r)));
      // Mirror the rename onto the expenses already loaded.
      setExpenses((list) => list.map((e) => (
        e.expense_category === categoryModal.expense_category && e.expense_type === categoryModal.expense_type
          ? { ...e, expense_category: row.expense_category, expense_type: row.expense_type } : e)));
      toast('Category updated', 'success');
    } else {
      const row = await api.addCategory(payload);
      setCategoryRows((list) => [...list, row]);
      toast('Category added successfully', 'success');
    }
    setCategoryModal(null);
  }

  async function confirmDelete() {
    const { kind, id } = pendingDelete;
    setPendingDelete(null);
    const target = {
      expense: [expenses, setExpenses, api.deleteExpense, 'Expense'],
      product: [products, setProducts, api.deleteProduct, 'Product'],
      category: [categoryRows, setCategoryRows, api.deleteCategory, 'Category'],
    }[kind];
    const [list, setList, remove, name] = target;
    setList(list.filter((r) => r.id !== id)); // optimistic
    try {
      await remove(id);
      toast(`${name} deleted`, 'delete');
    } catch (err) {
      setList(list);
      toast('Could not delete from Supabase: ' + err.message, 'error');
    }
  }

  return (
    <>
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
            onSearch={setSearch}
            onSearchFocus={onSearchFocus}
            groups={searchGroups}
            theme={theme}
            onToggleTheme={onToggleTheme}
            profile={profile}
            onEditProfile={() => setProfileModal(true)}
            onSignOut={() => setSignOutConfirm(true)}
          />
          <main className="content">
            {page === 'dashboard' && <Dashboard expenses={expenses} month={dashMonth} onMonthChange={setDashMonth} fixedCategories={categories['Fixed Expenses'] || []} />}
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
            {page === 'categories' && (
              <CategoriesPage
                rows={categoryRows}
                loaded={categoriesLoaded}
                usage={categoryUsage}
                search={search}
                onAdd={() => setCategoryModal({})}
                onEdit={(row) => setCategoryModal(row)}
                onDelete={(row) => setPendingDelete({ kind: 'category', id: row.id, used: categoryUsage[`${row.expense_type}|${row.expense_category}`] || 0 })}
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
      {signOutConfirm && (
        <ConfirmModal
          title="Sign out?"
          message="Are you sure you want to sign out of Quantix Codex?"
          confirmLabel="Sign out"
          tone="primary"
          onCancel={() => setSignOutConfirm(false)}
          onConfirm={() => supabase.auth.signOut()}
        />
      )}
      {categoryModal && <CategoryModal category={categoryModal.id ? categoryModal : null} onSave={saveCategory} onClose={() => setCategoryModal(null)} />}
      {pendingDelete && <ConfirmModal
        label={pendingDelete.kind === 'category' ? 'category' : pendingDelete.kind}
        message={pendingDelete.kind === 'category'
          ? `Delete this category? ${pendingDelete.used ? `${pendingDelete.used} existing expense${pendingDelete.used === 1 ? '' : 's'} keep the name, but it will no longer appear in the Add expense list. ` : ''}This action cannot be undone.`
          : undefined}
        onCancel={() => setPendingDelete(null)} onConfirm={confirmDelete} />}
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

  if (profile === undefined) return <Blank />;

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
  if (session === undefined) return <Blank />;
  if (!session) return <LoginPage theme={theme} />;
  return <Gate session={session} theme={theme} onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} />;
}
