import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, Info, Loader2 } from 'lucide-react';
import Logo from '../components/Logo';
import Button from '../components/Button';
import SmartImage from '../components/SmartImage';
import { useAuth } from '../context/AuthContext';
import { img } from '../data/images';

const STRONG = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

/** Change own password. Customers, staff and admin all use this page; a newly hired staff member is sent here first. */
export default function ChangePassword() {
  const { user, staffSession, ready, changePassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!ready) return null;
  if (!user && !staffSession) {
    return <Navigate to="/login" replace state={{ from: '/change-password', message: 'Please log in to change your password.' }} />;
  }

  const forced = Boolean(staffSession?.mustChangePassword);
  const notice = location.state?.message;
  const home = staffSession ? '/admin' : '/dashboard';

  const submit = async (ev) => {
    ev.preventDefault();
    setFormError('');
    const e = {};
    if (!current) e.current = 'Enter your current password.';
    if (!STRONG.test(next)) e.next = 'Use at least 8 characters, including a letter and a number.';
    else if (next === current) e.next = 'Choose a password that is different from the current one.';
    if (confirm !== next) e.confirm = 'The two passwords do not match.';
    setErrors(e);
    if (Object.keys(e).length || saving) return;

    setSaving(true);
    const result = await changePassword(current, next);
    setSaving(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    setDone(true);
    setCurrent(''); setNext(''); setConfirm('');
    if (forced) setTimeout(() => navigate(home, { replace: true }), 1200);
  };

  const field = (id, label, value, setter, key, autoComplete) => (
    <div className="field">
      <label className="field__label" htmlFor={id}>{label}</label>
      <div className="input-wrap">
        <input
          id={id} type={show ? 'text' : 'password'} className="input" autoComplete={autoComplete} value={value}
          onChange={(e) => { setter(e.target.value); setErrors((x) => ({ ...x, [key]: undefined })); setDone(false); }}
          aria-invalid={Boolean(errors[key])}
        />
        <button type="button" className="input-wrap__btn" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide passwords' : 'Show passwords'}>
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {errors[key] && <span className="field__error" role="alert"><AlertCircle size={14} /> {errors[key]}</span>}
    </div>
  );

  return (
    <section className="auth">
      <div className="auth__media">
        <SmartImage src={img('barLounge', 1400)} alt="" className="cover-img" loading="eager" />
        <div className="auth__media-overlay">
          <h2>Keep your account safe.</h2>
          <p>Choose a password only you know.</p>
        </div>
      </div>
      <div className="auth__panel">
        <div className="auth__box">
          {!forced && <Link to={home} className="auth__back"><ArrowLeft size={15} /> Back</Link>}
          <div className="auth__logo"><Logo /></div>
          <h1 className="auth__title">{forced ? 'Set your own password' : 'Change password'}</h1>

          {forced && (
            <div className="alert alert--info" role="status">
              <Info size={18} /> Your account was created with a temporary password. Choose a new one to continue to the dashboard.
            </div>
          )}
          {!forced && notice && <div className="alert alert--info" role="status"><Info size={18} /> {notice}</div>}
          {formError && <div className="alert alert--error" role="alert"><AlertCircle size={18} /> {formError}</div>}
          {done && <div className="alert alert--success" role="status"><CheckCircle2 size={18} /> Your password was changed.</div>}

          <form onSubmit={submit} noValidate className="auth__form">
            {field('cp-current', forced ? 'Temporary password' : 'Current password', current, setCurrent, 'current', 'current-password')}
            {field('cp-new', 'New password', next, setNext, 'next', 'new-password')}
            {field('cp-confirm', 'Confirm new password', confirm, setConfirm, 'confirm', 'new-password')}
            <Button type="submit" variant="primary" block disabled={saving}>
              {saving ? (<><Loader2 size={16} className="spin" /> Saving…</>) : 'Change password'}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
