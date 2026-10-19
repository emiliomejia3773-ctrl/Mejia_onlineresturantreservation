import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import Logo from '../components/Logo';
import Button from '../components/Button';
import SmartImage from '../components/SmartImage';
import { useAuth } from '../context/AuthContext';
import { img } from '../data/images';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { user, ready, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!ready) return null;
  if (user && !loading) return <Navigate to="/dashboard" replace />;

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setFormError('');
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Please enter your full name.';
    if (!EMAIL_RE.test(form.email.trim())) e.email = 'Please enter a valid email address.';
    if (form.phone.replace(/\D/g, '').length < 7) e.phone = 'Please enter a valid phone number.';
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      e.password = 'Use at least 8 characters, including a letter and a number.';
    }
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match.';
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    const result = await register(form);
    if (result.ok) {
      navigate('/login', {
        replace: true,
        state: { from: from || '/book-now', email: form.email.trim(), message: 'Please log in to continue with your reservation.' },
      });
    } else {
      setLoading(false);
      setFormError(result.error);
    }
  };

  const Err = ({ m }) => (m ? <span className="field__error" role="alert"><AlertCircle size={14} /> {m}</span> : null);

  return (
    <section className="auth">
      <div className="auth__media">
        <SmartImage src={img('diningRoom', 1400)} alt="" className="cover-img" loading="eager" />
        <div className="auth__media-overlay">
          <h2>Join the table.</h2>
          <p>Create a free account to book in seconds and keep track of every reservation.</p>
        </div>
      </div>

      <div className="auth__panel">
        <div className="auth__box">
          <Link to="/login" state={{ from }} className="auth__back"><ArrowLeft size={15} /> Back to login</Link>
          <div className="auth__logo"><Logo /></div>
          <h1 className="auth__title">Create your account</h1>

          {formError && <div className="alert alert--error" role="alert"><AlertCircle size={18} /> {formError}</div>}

          <form onSubmit={submit} noValidate className="auth__form">
            <div className="field">
              <label className="field__label" htmlFor="r-name">Full name</label>
              <input id="r-name" className="input" autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} aria-invalid={Boolean(errors.name)} />
              <Err m={errors.name} />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="r-email">Email address</label>
              <input id="r-email" type="email" className="input" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} aria-invalid={Boolean(errors.email)} />
              <Err m={errors.email} />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="r-phone">Phone number</label>
              <input id="r-phone" type="tel" className="input" autoComplete="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} aria-invalid={Boolean(errors.phone)} />
              <Err m={errors.phone} />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="r-pass">Password</label>
              <div className="input-wrap">
                <input id="r-pass" type={show ? 'text' : 'password'} className="input" autoComplete="new-password" value={form.password} onChange={(e) => set('password', e.target.value)} aria-invalid={Boolean(errors.password)} />
                <button type="button" className="input-wrap__btn" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide passwords' : 'Show passwords'}>
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <Err m={errors.password} />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="r-confirm">Confirm password</label>
              <input id="r-confirm" type={show ? 'text' : 'password'} className="input" autoComplete="new-password" value={form.confirm} onChange={(e) => set('confirm', e.target.value)} aria-invalid={Boolean(errors.confirm)} />
              <Err m={errors.confirm} />
            </div>

            <Button type="submit" variant="primary" block disabled={loading}>
              {loading ? (<><Loader2 size={16} className="spin" /> Creating account…</>) : 'Create account'}
            </Button>
          </form>

          <p className="auth__switch">
            Already have an account? <Link to="/login" state={{ from }}>Log in</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
