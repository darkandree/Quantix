import React, { useEffect, useMemo, useRef, useState } from 'react';
import Avatar from './Avatar.jsx';
import { MoonIcon, SearchIcon, SunIcon, XIcon } from './Icons.jsx';

// `groups`: [{ title, items: [{ key, title, sub, right, pick }] }]
export default function Topbar({ search, onSearch, onSearchFocus, groups, theme, onToggleTheme, profile, onEditProfile, onSignOut }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [active, setActive] = useState(0);
  const menuRef = useRef(null);
  const boxRef = useRef(null);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const showResults = resultsOpen && search.trim().length > 0;

  useEffect(() => { setActive(0); }, [search]);

  useEffect(() => {
    const onDown = (e) => {
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false);
      if (!boxRef.current?.contains(e.target)) setResultsOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') { setMenuOpen(false); setResultsOpen(false); } };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, []);

  function choose(item) {
    setResultsOpen(false);
    item.pick();
  }

  function onKeyDown(e) {
    if (!flat.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setResultsOpen(true); setActive((i) => (i + 1) % flat.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i - 1 + flat.length) % flat.length); }
    else if (e.key === 'Enter' && showResults) { e.preventDefault(); choose(flat[active]); }
  }

  let index = -1;
  return (
    <header className="topbar">
      <div className="search-wrap" ref={boxRef}>
        <label className="search-box">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search everything — expenses, products, categories, users..."
            value={search}
            onChange={(e) => { onSearch(e.target.value); setResultsOpen(true); }}
            onFocus={() => { setResultsOpen(true); onSearchFocus(); }}
            onKeyDown={onKeyDown}
          />
          {search && (
            <button type="button" className="search-clear" aria-label="Clear search" onClick={() => onSearch('')}><XIcon /></button>
          )}
        </label>
        {showResults && (
          <div className="search-results">
            {flat.length === 0 && <div className="search-empty">No results for “{search.trim()}”</div>}
            {groups.map((g) => (
              <div className="search-group" key={g.title}>
                <div className="search-group-title">{g.title}</div>
                {g.items.map((item) => {
                  index += 1;
                  const i = index;
                  return (
                    <button
                      type="button"
                      key={item.key}
                      className={'search-item' + (i === active ? ' active' : '')}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => choose(item)}
                    >
                      <span className="si-main">
                        <span className="si-title">{item.title}</span>
                        {item.sub && <span className="si-sub">{item.sub}</span>}
                      </span>
                      {item.right && <span className="si-right">{item.right}</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="topbar-actions">
        <button className="icon-btn" aria-label="Toggle dark mode" type="button" onClick={onToggleTheme}>
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
        <div className="user-menu" ref={menuRef}>
          <button className="avatar-btn" type="button" aria-label="Account menu" onClick={() => setMenuOpen((o) => !o)}>
            <Avatar profile={profile} size={40} />
          </button>
          {menuOpen && (
            <div className="user-dropdown">
              <div className="user-dropdown-head">
                <div className="ud-name">{profile?.full_name || 'Unnamed'}</div>
                <div className="ud-email">{profile?.email}</div>
              </div>
              <button type="button" onClick={() => { setMenuOpen(false); onEditProfile(); }}>Edit profile</button>
              <button type="button" onClick={onSignOut}>Sign out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
