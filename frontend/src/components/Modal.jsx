import { useEffect } from 'react';

export default function Modal({ title, onClose, children, maxWidth = 480 }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal" style={{ maxWidth }} onClick={(e) => e.stopPropagation()}>
        {title ? <h2>{title}</h2> : null}
        {children}
      </div>
    </div>
  );
}
