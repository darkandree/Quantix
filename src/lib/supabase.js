import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && key);

// createClient throws on an empty URL, so fall back to a placeholder; the app
// shows a "not configured" status instead of making requests in that case.
export const supabase = createClient(url || 'http://localhost', key || 'missing');
