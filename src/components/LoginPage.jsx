import React, { useState } from 'react';
import { supabase } from '../lib/supabase.js';

export default function LoginPage({ theme }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (err) { setError(err.message); setBusy(false); }
  }

  return (
    <div className="login-wrap" data-theme={theme}>
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand">
          <img src="/logo.png" alt="Logo" />
          <div>
            <div className="login-title">Expense Ledger</div>
            <div className="login-sub">Expense Monitoring</div>
          </div>
        </div>
        <h1>Sign in</h1>
        <p className="page-sub">Use the email and password for your account.</p>
        <div className="field">
          <label htmlFor="loginEmail">Email</label>
          <input id="loginEmail" type="email" required autoFocus autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="loginPassword">Password</label>
          <input id="loginPassword" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="error" style={{ display: error ? 'block' : 'none' }}>{error}</div>
        <button type="submit" className="btn-primary login-btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  );
}