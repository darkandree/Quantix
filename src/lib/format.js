export const fmt = (n) =>
  '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function parseExpenseDate(raw) {
  const [y, m, d] = String(raw || '').slice(0, 10).split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
}

export function monthKey(raw) {
  const dt = parseExpenseDate(raw);
  return dt ? `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}` : '';
}

export function displayDate(raw) {
  const dt = parseExpenseDate(raw);
  return dt ? dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : String(raw || '');
}

export function monthLabel(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

export const currentMonthKey = () => monthKey(new Date().toISOString().slice(0, 10));

export function prevMonthKey(key) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export const daysInMonthFor = (key) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m, 0).getDate();
};

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const byNewest = (a, b) => String(b.date).localeCompare(String(a.date)) || b.id - a.id;

export function totalsFor(list) {
  const sum = (arr) => arr.reduce((s, e) => s + Number(e.amount || 0), 0);
  return {
    totalAll: sum(list),
    totalFixed: sum(list.filter((e) => e.expense_type === 'Fixed Expenses')),
    totalVariable: sum(list.filter((e) => e.expense_type === 'Variable Expenses')),
  };
}

export function expensesForMonth(expenses, key) {
  return !key || key === 'all' ? expenses : expenses.filter((e) => monthKey(e.date) === key);
}
