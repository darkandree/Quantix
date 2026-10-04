import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, TrashToast } from './Icons.jsx';

const icons = { success: <CheckCircle />, error: <AlertCircle />, delete: <TrashToast /> };

function Toast({ toast, onDone }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShow(true));
    const hide = setTimeout(() => setShow(false), toast.duration);
    const remove = setTimeout(() => onDone(toast.id), toast.duration + 300);
    return () => { cancelAnimationFrame(raf); clearTimeout(hide); clearTimeout(remove); };
  }, [toast, onDone]);
  return (
    <div className={`toast ${toast.type}${show ? ' show' : ''}`}>
      {icons[toast.type]}
      <span className="toast-message">{toast.message}</span>
    </div>
  );
}

export default function Toasts({ toasts, onDone }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => <Toast key={t.id} toast={t} onDone={onDone} />)}
    </div>
  );
}
