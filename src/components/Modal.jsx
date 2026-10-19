import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ title, onClose, children, actions }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <button type="button" className="modal__close" onClick={onClose} aria-label="Close dialog">
          <X size={22} />
        </button>
        <h3>{title}</h3>
        {children}
        {actions && <div className="modal__actions">{actions}</div>}
      </div>
    </div>
  );
}
