import { supabase } from './supabase.js';

const PAGE = 1000; // PostgREST's default max rows per request

function check({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

async function selectAll(table, order) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    let q = supabase.from(table).select('*').range(from, from + PAGE - 1);
    for (const [col, asc] of order) q = q.order(col, { ascending: asc });
    const batch = check(await q);
    rows.push(...batch);
    if (batch.length < PAGE) return rows;
  }
}

const num = (key) => (row) => ({ ...row, [key]: Number(row[key]) || 0 });

export async function fetchCategories() {
  const rows = await selectAll('expense_details', [['id', true]]);
  const grouped = { 'Variable Expenses': [], 'Fixed Expenses': [] };
  rows.forEach((r) => grouped[r.expense_type]?.push(r.expense_category));
  return grouped;
}

export async function fetchExpenses() {
  return (await selectAll('expenses', [['date', false], ['id', false]])).map(num('amount'));
}

export async function addExpense(expense) {
  return num('amount')(check(await supabase.from('expenses').insert(expense).select().single()));
}

export async function deleteExpense(id) {
  check(await supabase.from('expenses').delete().eq('id', id));
}

export async function fetchProducts() {
  return (await selectAll('products', [['id', false]])).map(num('price'));
}

export async function addProduct(product) {
  return num('price')(check(await supabase.from('products').insert(product).select().single()));
}

export async function deleteProduct(id) {
  check(await supabase.from('products').delete().eq('id', id));
}
