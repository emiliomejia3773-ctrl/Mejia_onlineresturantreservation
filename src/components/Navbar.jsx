import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { KeyRound, LogOut, Menu as MenuIcon, X } from 'lucide-react';
import Logo from './Logo';
import Button from './Button';
import { useAuth } from '../context/AuthContext';
import { useAdmin } from '../admin/AdminContext';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/menu', label: 'Menu' },
  { to: '/about', label: 'About' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { session, logout: adminLogout } = useAdmin(); // admin / staff demo session
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const transparent = pathname === '/' && !scrolled && !open;

  const handleLogout = () => {
    logout();
    adminLogout();
    setOpen(false);
    navigate('/');
  };

  return (
    <header className={`navbar ${transparent ? 'navbar--transparent' : ''} ${open ? 'navbar--open' : ''}`}>
      <div className="container navbar__inner">
        <Logo />
        <button
          type="button"
          className="navbar__toggle"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="main-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X size={26} /> : <MenuIcon size={26} />}
        </button>

        <nav id="main-menu" className={`navbar__menu ${open ? 'is-open' : ''}`} aria-label="Main">
          <div className="navbar__links">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`}>
                {l.label}
              </NavLink>
            ))}
            {user ? (
              <NavLink to="/dashboard" className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`}>
                My Reservations
              </NavLink>
            ) : session ? (
              <NavLink to="/admin" className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`}>
                Admin Panel
              </NavLink>
            ) : (
              <NavLink to="/login" className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`}>
                Login
              </NavLink>
            )}
          </div>
          <div className="navbar__actions">
            {(user || session) && (
              <NavLink to="/change-password" className="navbar__link">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <KeyRound size={15} /> Password
                </span>
              </NavLink>
            )}
            {(user || session) && (
              <button type="button" className="navbar__link" onClick={handleLogout}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <LogOut size={15} /> Log out
                </span>
              </button>
            )}
            <Button to="/book-now" variant="primary" size="sm">
              Book Now
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
