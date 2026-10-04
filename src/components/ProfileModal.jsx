import React, { useRef, useState } from 'react';
import Modal, { Saving } from './Modal.jsx';
import Avatar from './Avatar.jsx';
import * as api from '../lib/api.js';

export default function ProfileModal({ profile, onSaved, onClose }) {
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(profile.avatar_url);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const input = useRef(null);

  function pick(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { setError('Image must be 2 MB or smaller.'); return; }
    setError('');
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const changes = { full_name: fullName.trim() };
      if (file) changes.avatar_url = await api.uploadAvatar(profile.id, file);
      onSaved(await api.updateProfile(profile.id, changes));
    } catch (err) {
      setError('Could not save profile: ' + err.message);
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      {saving && <Saving text="Saving profile…" />}
      <h2>Edit profile</h2>
      <form onSubmit={submit}>
        <div className="field avatar-field">
          <Avatar profile={{ ...profile, avatar_url: preview }} size={72} />
          <div>
            <button type="button" className="btn-ghost" onClick={() => input.current.click()}>Change picture</button>
            <div className="hint-text">PNG, JPG, WebP or GIF, up to 2 MB.</div>
            <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={pick} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="fullNameInput">Full name<span className="required-mark">*</span></label>
          <input id="fullNameInput" type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="text" value={profile.email || ''} disabled />
        </div>
        <div className="error" style={{ display: error ? 'block' : 'none' }}>{error}</div>
        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button>
        </div>
      </form>
    </Modal>
  );
}