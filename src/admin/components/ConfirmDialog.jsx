import Dialog from './Dialog';

export default function ConfirmDialog({ title, message, confirmLabel = 'Confirm', tone, onConfirm, onClose }) {
  return (
    <Dialog
      title={title}
      tone={tone}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="adm-btn adm-btn--outline" onClick={onClose}>Cancel</button>
          <button type="button" className={`adm-btn ${tone === 'danger' ? 'adm-btn--danger-solid' : 'adm-btn--primary'}`} onClick={onConfirm}>{confirmLabel}</button>
        </>
      }
    >
      <p>{message}</p>
    </Dialog>
  );
}
