import React from 'react';

export default function Avatar({ profile, size = 36 }) {
  const name = profile?.full_name || profile?.email || '?';
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {profile?.avatar_url ? <img src={profile.avatar_url} alt={name} /> : name.trim().charAt(0).toUpperCase()}
    </span>
  );
}