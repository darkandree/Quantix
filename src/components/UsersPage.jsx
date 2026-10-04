import React from 'react';
import Avatar from './Avatar.jsx';

export default function UsersPage({ users, loaded, me, search }) {
  const q = search.trim().toLowerCase();
  const shown = q ? users.filter((u) => `${u.full_name} ${u.email}`.toLowerCase().includes(q)) : users;
  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1>Users</h1>
          <p className="page-sub">People who can sign in. Add users or change status in the Supabase dashboard.</p>
        </div>
      </div>
      <div className="table-card">
        <table>
          <thead>
            <tr><th>Full name</th><th>Email</th><th>Status</th><th>Joined</th></tr>
          </thead>
          <tbody>
            {shown.length === 0 && <tr className="empty-row"><td colSpan={4}>{loaded ? 'No users found.' : 'Loading users…'}</td></tr>}
            {shown.map((u) => (
              <tr key={u.id}>
                <td className="category">
                  <span className="user-cell">
                    <Avatar profile={u} size={32} />
                    <span className="cat-name">{u.full_name || '—'}{u.id === me ? ' (you)' : ''}</span>
                  </span>
                </td>
                <td className="date">{u.email}</td>
                <td><span className={'tag ' + (u.status === 'Active' ? 'fixed' : 'variable')}>{u.status}</span></td>
                <td className="date">{new Date(u.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}