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

export async function updateExpense(id, changes) {
  return num('amount')(check(await supabase.from('expenses').update(changes).eq('id', id).select().single()));
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

// ---------- Profiles / avatars ----------
export async function fetchProfile(id) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchProfiles() {
  return check(await supabase.from('profiles').select('*').order('created_at', { ascending: true }));
}

export async function updateProfile(id, changes) {
  return check(await supabase.from('profiles').update(changes).eq('id', id).select().single());
}

// Uploads to avatars/<user id>/<timestamp>.<ext> and returns the public URL.
export async function uploadAvatar(userId, file) {
  const ext = (file.name.split('.').pop() || 'png').toLowerCase();
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('avatars').upload(path, file, { contentType: file.type, upsert: true });
  if (error) throw new Error(error.message);
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}
// ---------- Expense categories (expense_details) ----------
export async function fetchCategoryRows() {
  return selectAll('expense_details', [['expense_type', true], ['expense_category', true]]);
}

export async function addCategory(row) {
  return check(await supabase.from('expense_details').insert(row).select().single());
}

// Expenses store the category as text, so a rename also updates the expenses that use it.
export async function updateCategory(old, changes) {
  const row = check(await supabase.from('expense_details').update(changes).eq('id', old.id).select().single());
  if (old.expense_category !== row.expense_category || old.expense_type !== row.expense_type) {
    check(await supabase.from('expenses').update({ expense_category: row.expense_category, expense_type: row.expense_type })
      .eq('expense_category', old.expense_category).eq('expense_type', old.expense_type));
  }
  return row;
}

export async function deleteCategory(id) {
  check(await supabase.from('expense_details').delete().eq('id', id));
}
