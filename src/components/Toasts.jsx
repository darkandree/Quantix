import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, TrashToast, XIcon } from './Icons.jsx';

const META = {
  success: { title: 'Success', icon: <CheckCircle /> },
  error: { title: 'Error', icon: <AlertCircle /> },
  delete: { title: 'Deleted', icon: <TrashToast /> },
};

function Toast({ toast, onDone }) {
  const [show, setShow] = useState(false);
  const [closing, setClosing] = useState(false);
  const meta = META[toast.type] || META.success;

  const dismiss = () => {
    setShow(false);
    setClosing(true);
    setTimeout(() => onDone(toast.id), 250);
  };

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShow(true));
    const hide = setTimeout(dismiss, toast.duration);
    return () => { cancelAnimationFrame(raf); clearTimeout(hide); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`toast ${toast.type}${show ? ' show' : ''}${closing ? ' closing' : ''}`} role="status">
      <span className="toast-badge">{meta.icon}</span>
      <div className="toast-body">
        <div className="toast-title">{toast.title || meta.title}</div>
        <div className="toast-message">{toast.message}</div>
      </div>
      <button type="button" className="toast-close" aria-label="Dismiss" onClick={dismiss}><XIcon /></button>
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
