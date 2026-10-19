import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/** Simple modal. Closes with Escape, the X button, or a click on the dark backdrop. */
export default function Dialog({ title, onClose, children, footer, tone }) {
  const ref = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div className="adm-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} className={`adm-dialog ${tone ? `adm-dialog--${tone}` : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="adm-dialog__head">
          <h2>{title}</h2>
          <button type="button" className="adm-iconbtn" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
        </div>
        <div className="adm-dialog__body">{children}</div>
        {footer && <div className="adm-dialog__foot">{footer}</div>}
      </div>
    </div>
  );
}
