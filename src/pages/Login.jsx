import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, Info, Loader2 } from 'lucide-react';
import Logo from '../components/Logo';
import Button from '../components/Button';
import SmartImage from '../components/SmartImage';
import { useAuth } from '../context/AuthContext';
import { img } from '../data/images';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Quick-fill buttons for the accounts created by `npm run seed`. Shown in development builds only.
const SEEDED_ACCOUNTS = [
  { label: 'Customer', email: 'demo@aurelia.com', password: 'Demo@1234' },
  { label: 'Admin', email: 'admin@aurelia-demo.com', password: 'Admin@1234' },
  { label: 'Manager', email: 'maria.santos@aurelia-demo.com', password: 'Staff@1234' },
];

export default function Login() {
  const { user, staffSession, ready, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || '/dashboard';
  const notice = location.state?.message;
  const registeredEmail = location.state?.email;

  const [email, setEmail] = useState(registeredEmail || '');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

  // Already logged in: go straight to where they were headed.
  if (!ready) return null;
  if (user && !loading) return <Navigate to={from} replace />;
  if (staffSession && !loading) return <Navigate to={from.startsWith('/admin') ? from : '/admin'} replace />;

  const submit = async (ev) => {
    ev.preventDefault();
    setFormError('');
    setResetMsg('');
    const e = {};
    if (!EMAIL_RE.test(email.trim())) e.email = 'Please enter a valid email address.';
    if (!password) e.password = 'Please enter your password.';
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    const result = await login(email, password, remember);
    if (!result.ok) {
      setLoading(false);
      setFormError(result.error);
      return;
    }
    // Customers continue to where they were headed; admin and staff accounts open the admin area.
    if (result.kind === 'customer') navigate(from, { replace: true });
    else navigate(from.startsWith('/admin') ? from : '/admin', { replace: true });
  };

  const forgot = () => {
    setFormError('');
    if (!EMAIL_RE.test(email.trim())) {
      setErrors({ email: 'Enter your email above first.' });
      return;
    }
    setResetMsg('Password reset by email is not available yet. Please contact the restaurant and we will help you get back in.');
  };

  const fill = (e, p) => {
    setEmail(e);
    setPassword(p);
    setErrors({});
    setFormError('');
  };

  return (
    <section className="auth">
      <div className="auth__media">
        <SmartImage src={img('barLounge', 1400)} alt="" className="cover-img" loading="eager" />
        <div className="auth__media-overlay">
          <h2>Your table is waiting.</h2>
          <p>Log in to reserve, manage and track your bookings.</p>
        </div>
      </div>

      <div className="auth__panel">
        <div className="auth__box">
          <Link to="/" className="auth__back"><ArrowLeft size={15} /> Back to home</Link>
          <div className="auth__logo"><Logo /></div>
          <h1 className="auth__title">Welcome back</h1>

          {notice && <div className="alert alert--info" role="status"><Info size={18} /> {notice}</div>}
          {registeredEmail && <div className="alert alert--success" role="status"><CheckCircle2 size={18} /> Account created. You can now log in.</div>}
          {formError && <div className="alert alert--error" role="alert"><AlertCircle size={18} /> {formError}</div>}
          {resetMsg && <div className="alert alert--success" role="status"><CheckCircle2 size={18} /> {resetMsg}</div>}

          <form onSubmit={submit} noValidate className="auth__form">
            <div className="field">
              <label className="field__label" htmlFor="l-email">Email address</label>
              <input id="l-email" type="email" className="input" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setErrors((x) => ({ ...x, email: undefined })); }} aria-invalid={Boolean(errors.email)} />
              {errors.email && <span className="field__error" role="alert"><AlertCircle size={14} /> {errors.email}</span>}
            </div>
            <div className="field">
              <label className="field__label" htmlFor="l-pass">Password</label>
              <div className="input-wrap">
                <input id="l-pass" type={show ? 'text' : 'password'} className="input" autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); setErrors((x) => ({ ...x, password: undefined })); }} aria-invalid={Boolean(errors.password)} />
                <button type="button" className="input-wrap__btn" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <span className="field__error" role="alert"><AlertCircle size={14} /> {errors.password}</span>}
            </div>

            <div className="auth__row">
              <label className="check"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me</label>
              <button type="button" className="text-btn" onClick={forgot}>Forgot password?</button>
            </div>
            {remember && <p className="auth__hint">You will stay logged in on this device until you log out.</p>}

            <Button type="submit" variant="primary" block disabled={loading}>
              {loading ? (<><Loader2 size={16} className="spin" /> Logging in…</>) : 'Log in'}
            </Button>
          </form>

          {import.meta.env.DEV && (
          <div className="demo-box">
            <strong>Seeded accounts (development only)</strong>
            {SEEDED_ACCOUNTS.map((a) => (
              <div key={a.label} className="demo-acct">
                <div>
                  <b>{a.label}</b>
                  <span>{a.email}</span>
                  <span>{a.password}</span>
                </div>
                <button type="button" className="text-btn" onClick={() => fill(a.email, a.password)}>Use</button>
              </div>
            ))}
            <small>Admin and staff accounts open the admin area after login.</small>
          </div>
          )}

          <p className="auth__switch">
            New to Aurelia? <Link to="/register" state={{ from: location.state?.from }}>Create an account</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
