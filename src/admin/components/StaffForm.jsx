import { useState } from 'react';
import { AlertCircle, CheckCircle2, Copy } from 'lucide-react';
import Dialog from './Dialog';
import { POSITIONS, ROLES, ROLE_INFO } from '../adminData';
import { toISO } from '../../data/reservationData';
import { useAdmin } from '../AdminContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Used for both "Hire new staff" (mode="hire") and "Edit staff" (mode="edit").
 * onSubmit(values) must return { ok, error?, staff?, tempPassword? }.
 */
export default function StaffForm({ mode, initial, onSubmit, onClose }) {
  const today = toISO(new Date());
  const { session } = useAdmin();
  // Only the administrator can create Manager accounts (the only role with a login).
  const roleOptions = session?.type === 'admin' ? ROLES : ROLES.filter((r) => r !== 'Manager');
  const [values, setValues] = useState({
    name: initial?.name || '',
    email: initial?.email || '',
    phone: initial?.phone || '',
    position: initial?.position || POSITIONS[0],
    role: initial?.role || ROLES[2],
    hiredAt: initial?.hiredAt || today,
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (key, value) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    setFormError('');
  };

  const validate = () => {
    const e = {};
    if (values.name.trim().length < 2) e.name = 'Please enter the full name.';
    if (!EMAIL_RE.test(values.email.trim())) e.email = 'Please enter a valid email address.';
    if (values.phone.replace(/\D/g, '').length < 7) e.phone = 'Please enter a valid phone number.';
    if (!values.hiredAt) e.hiredAt = 'Please choose the hiring date.';
    else if (values.hiredAt > today) e.hiredAt = 'The hiring date cannot be in the future.';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length || saving) return;
    setSaving(true);
    const result = await onSubmit(values);
    setSaving(false);
    if (!result.ok) {
      setFormError(result.error || 'Something went wrong.');
      return;
    }
    if (mode === 'hire' || result.tempPassword) setCreated(result); // edit mode: the parent closes the dialog unless a login was just created
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(created.tempPassword);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const Err = ({ m }) => (m ? <span className="adm-error" role="alert"><AlertCircle size={14} /> {m}</span> : null);

  // ----- Success screen after hiring -----
  if (created) {
    return (
      <Dialog title={created.tempPassword ? 'Manager account created' : 'Staff member saved'} onClose={onClose} footer={<button type="button" className="adm-btn adm-btn--primary" onClick={onClose}>Done</button>}>
        <div className="adm-success">
          <CheckCircle2 size={40} strokeWidth={1.5} aria-hidden="true" />
          <p><strong>{created.staff.name}</strong> was added as <strong>{created.staff.position}</strong> ({created.staff.role}).</p>
        </div>
        <dl className="adm-dl">
          <div><dt>Employee ID</dt><dd>{created.staff.id}</dd></div>
          {created.tempPassword ? (
            <>
              <div><dt>Login email</dt><dd>{created.staff.email}</dd></div>
              <div>
                <dt>Temporary password</dt>
                <dd>
                  <code className="adm-code">{created.tempPassword}</code>
                  <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={copyPassword}><Copy size={14} /> {copied ? 'Copied' : 'Copy'}</button>
                </dd>
              </div>
            </>
          ) : (
            <div><dt>System login</dt><dd>None (staff record only)</dd></div>
          )}
        </dl>
        <div className="adm-alert adm-alert--info">
          <AlertCircle size={18} aria-hidden="true" />
          <span>
            {created.tempPassword
              ? 'This password is shown only once and is stored encrypted. No email is sent, so pass it to the manager privately. They sign in at /login with this email and must choose their own password first.'
              : 'Only Managers have a system account. This person is kept as a staff record and cannot sign in.'}
          </span>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog
      title={mode === 'hire' ? 'Hire new staff member' : `Edit ${initial.name}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="adm-btn adm-btn--outline" onClick={onClose}>Cancel</button>
          <button type="submit" form="staff-form" className="adm-btn adm-btn--primary">{mode === 'hire' ? (values.role === 'Manager' ? 'Hire & create account' : 'Hire staff member') : 'Save changes'}</button>
        </>
      }
    >
      <form id="staff-form" onSubmit={submit} noValidate className="adm-form">
        {mode === 'hire' && (
          <div className="adm-alert adm-alert--info">
            <AlertCircle size={18} aria-hidden="true" />
            <span>{values.role === 'Manager' ? 'A Manager login is created with the email below and a temporary password that is shown once after saving.' : 'This role is saved as a staff record only. It does not get a system login — only Managers can sign in.'}</span>
          </div>
        )}
        {formError && <div className="adm-alert adm-alert--error" role="alert"><AlertCircle size={18} /> <span>{formError}</span></div>}

        <div className="adm-grid-2">
          <div className="adm-field adm-span-2">
            <label className="adm-label" htmlFor="s-name">Full name</label>
            <input id="s-name" className="adm-input" value={values.name} onChange={(e) => set('name', e.target.value)} aria-invalid={Boolean(errors.name)} autoComplete="off" />
            <Err m={errors.name} />
          </div>
          <div className="adm-field">
            <label className="adm-label" htmlFor="s-email">Email {mode === 'hire' && '(login)'}</label>
            <input id="s-email" type="email" className="adm-input" value={values.email} onChange={(e) => set('email', e.target.value)} aria-invalid={Boolean(errors.email)} autoComplete="off" />
            <Err m={errors.email} />
          </div>
          <div className="adm-field">
            <label className="adm-label" htmlFor="s-phone">Phone</label>
            <input id="s-phone" type="tel" className="adm-input" value={values.phone} onChange={(e) => set('phone', e.target.value)} aria-invalid={Boolean(errors.phone)} autoComplete="off" />
            <Err m={errors.phone} />
          </div>
          <div className="adm-field">
            <label className="adm-label" htmlFor="s-position">Job position</label>
            <select id="s-position" className="adm-select" value={values.position} onChange={(e) => set('position', e.target.value)}>
              {POSITIONS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="adm-field">
            <label className="adm-label" htmlFor="s-role">Staff role</label>
            <select id="s-role" className="adm-select" value={values.role} onChange={(e) => set('role', e.target.value)}>
              {roleOptions.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <p className="adm-help adm-span-2">{ROLE_INFO[values.role]}</p>
          <div className="adm-field adm-span-2">
            <label className="adm-label" htmlFor="s-hired">Hiring date</label>
            <input id="s-hired" type="date" className="adm-input" max={today} value={values.hiredAt} onChange={(e) => set('hiredAt', e.target.value)} aria-invalid={Boolean(errors.hiredAt)} />
            <Err m={errors.hiredAt} />
          </div>
        </div>
      </form>
    </Dialog>
  );
}
