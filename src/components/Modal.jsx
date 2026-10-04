import React, { useEffect } from 'react';

// Overlay with click-outside and Escape to close. Always mounted by its parent
// only while open, so no open-state class juggling is needed.
export default function Modal({ onClose, className = '', children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${className}`} style={{ position: 'relative' }}>{children}</div>
    </div>
  );
}

export function ConfirmModal({ label, onCancel, onConfirm }) {
  return (
    <Modal onClose={onCancel} className="confirm-modal">
      <h2>Delete record?</h2>
      <p className="confirm-text">Are you sure you want to delete this {label}? This action cannot be undone.</p>
      <div className="modal-actions">
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn-danger" onClick={onConfirm}>Delete</button>
      </div>
    </Modal>
  );
}
