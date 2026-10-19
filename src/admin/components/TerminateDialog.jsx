import { useState } from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import Dialog from './Dialog';
import { toISO } from '../../data/reservationData';

/** Termination needs a reason, an effective date and an explicit acknowledgement. */
export default function TerminateDialog({ person, onConfirm, onClose }) {
  const today = toISO(new Date());
  const [reason, setReason] = useState('');
  const [date, setDate] = useState(today);
  const [ack, setAck] = useState(false);
  const [errors, setErrors] = useState({});

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    if (reason.trim().length < 10) next.reason = 'Please enter a reason (at least 10 characters).';
    if (!date || date < person.hiredAt || date > today) next.date = 'Choose a date between the hiring date and today.';
    if (!ack) next.ack = 'Please confirm that you understand.';
    setErrors(next);
    if (Object.keys(next).length) return;
    onConfirm({ reason, date });
  };

  return (
    <Dialog
      title={`Terminate ${person.name}?`}
      tone="danger"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="adm-btn adm-btn--outline" onClick={onClose}>Cancel</button>
          <button type="submit" form="terminate-form" className="adm-btn adm-btn--danger-solid">Terminate and delete record</button>
        </>
      }
    >
      <form id="terminate-form" onSubmit={submit} noValidate className="adm-form">
        <div className="adm-alert adm-alert--warning">
          <AlertTriangle size={18} aria-hidden="true" />
          <span>Their account access ends immediately. Their record, including sign-in history, is permanently deleted from the database. Only a short note stays in the activity log.</span>
        </div>

        <div className="adm-field">
          <label className="adm-label" htmlFor="t-reason">Reason for termination <span className="adm-req">*</span></label>
          <textarea id="t-reason" className="adm-textarea" rows={4} value={reason} onChange={(e) => { setReason(e.target.value); setErrors((x) => ({ ...x, reason: undefined })); }} aria-invalid={Boolean(errors.reason)} placeholder="Describe the reason for the record…" />
          {errors.reason && <span className="adm-error" role="alert"><AlertCircle size={14} /> {errors.reason}</span>}
        </div>

        <div className="adm-field">
          <label className="adm-label" htmlFor="t-date">Effective date <span className="adm-req">*</span></label>
          <input id="t-date" type="date" className="adm-input" min={person.hiredAt} max={today} value={date} onChange={(e) => { setDate(e.target.value); setErrors((x) => ({ ...x, date: undefined })); }} aria-invalid={Boolean(errors.date)} />
          {errors.date && <span className="adm-error" role="alert"><AlertCircle size={14} /> {errors.date}</span>}
        </div>

        <div className="adm-field">
          <label className="adm-check">
            <input type="checkbox" checked={ack} onChange={(e) => { setAck(e.target.checked); setErrors((x) => ({ ...x, ack: undefined })); }} />
            <span>I understand that {person.name} will lose access and that their record will be permanently deleted.</span>
          </label>
          {errors.ack && <span className="adm-error" role="alert"><AlertCircle size={14} /> {errors.ack}</span>}
        </div>
      </form>
    </Dialog>
  );
}
