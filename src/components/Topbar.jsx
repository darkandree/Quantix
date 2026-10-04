import React, { useEffect, useRef, useState } from 'react';
import Avatar from './Avatar.jsx';
import { MoonIcon, SearchIcon, SunIcon } from './Icons.jsx';

export default function Topbar({ search, onSearch, theme, onToggleTheme, profile, onEditProfile, onSignOut }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <header className="topbar">
      <label className="search-box">
        <SearchIcon />
        <input type="search" placeholder="Search everything — expenses, products, categories..." value={search} onChange={(e) => onSearch(e.target.value)} />
      </label>
      <div className="topbar-actions">
        <button className="icon-btn" aria-label="Toggle dark mode" type="button" onClick={onToggleTheme}>
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
        <div className="user-menu" ref={ref}>
          <button className="avatar-btn" type="button" aria-label="Account menu" onClick={() => setOpen((o) => !o)}>
            <Avatar profile={profile} size={40} />
          </button>
          {open && (
            <div className="user-dropdown">
              <div className="user-dropdown-head">
                <div className="ud-name">{profile?.full_name || 'Unnamed'}</div>
                <div className="ud-email">{profile?.email}</div>
              </div>
              <button type="button" onClick={() => { setOpen(false); onEditProfile(); }}>Edit profile</button>
              <button type="button" onClick={onSignOut}>Sign out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}