import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, Bell, CalendarCheck, CheckCircle2, ChevronDown, ExternalLink, KeyRound, LayoutDashboard, LogOut, Menu, Users, X } from 'lucide-react';
import Logo from '../components/Logo';
import Avatar from './components/Avatar';
import NotificationList from './components/NotificationList';
import { useAdmin } from './AdminContext';
import './admin.css';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/staff', label: 'Staff Management', icon: Users, adminOnly: true },
];

export default function AdminShell() {
  const { notifications, unreadCount, markNotificationRead, markAllRead, toast, dismissToast, session, logout } = useAdmin();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const [menu, setMenu] = useState(null); // 'bell' | 'profile' | null
  const bellRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const previous = document.title;
    document.title = 'Admin · Aurelia';
    return () => { document.title = previous; };
  }, []);

  // Close the mobile menu and dropdowns when the page changes.
  useEffect(() => {
    setNavOpen(false);
    setMenu(null);
  }, [pathname]);

  // Close dropdowns on outside click / Escape.
  useEffect(() => {
    if (!menu) return undefined;
    const onDown = (e) => {
      const inside = bellRef.current?.contains(e.target) || profileRef.current?.contains(e.target);
      if (!inside) setMenu(null);
    };
    const onKey = (e) => e.key === 'Escape' && setMenu(null);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  const toggle = (name) => setMenu((m) => (m === name ? null : name));

  return (
    <div className="adm">
      {navOpen && <button type="button" className="adm-overlay" aria-label="Close menu" onClick={() => setNavOpen(false)} />}

      <aside className={`adm-side ${navOpen ? 'is-open' : ''}`}>
        <div className="adm-side__brand">
          <Logo to="/admin" />
          <button type="button" className="adm-side__close" onClick={() => setNavOpen(false)} aria-label="Close menu"><X size={20} /></button>
        </div>

        <nav className="adm-nav" aria-label="Admin sections">
          <span className="adm-nav__label">Manage</span>
          {NAV.filter((item) => !item.adminOnly || session.canManageStaff).map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `adm-nav__item ${isActive ? 'is-active' : ''}`}>
              <Icon size={18} aria-hidden="true" /> <span>{label}</span>
            </NavLink>
          ))}
          <span className="adm-nav__label">More</span>
          <Link to="/admin/reservations" className="adm-nav__item">
            <CalendarCheck size={18} aria-hidden="true" /> <span>Reservations</span>
          </Link>
        </nav>

        <Link to="/" className="adm-side__back"><ExternalLink size={16} aria-hidden="true" /> <span>View website</span></Link>
      </aside>

      <div className="adm-content">
        <header className="adm-top">
          <button type="button" className="adm-iconbtn adm-top__menu" onClick={() => setNavOpen(true)} aria-label="Open menu" aria-expanded={navOpen}>
            <Menu size={22} />
          </button>
          <span className="adm-top__title">Admin dashboard</span>

          <div className="adm-top__right">
            {/* Notifications */}
            <div className="adm-dd-wrap" ref={bellRef}>
              <button type="button" className="adm-iconbtn adm-bell" onClick={() => toggle('bell')} aria-label={`Notifications, ${unreadCount} unread`} aria-expanded={menu === 'bell'}>
                <Bell size={20} />
                {unreadCount > 0 && <span className="adm-bell__count">{unreadCount}</span>}
              </button>
              {menu === 'bell' && (
                <div className="adm-dd adm-dd--wide" role="dialog" aria-label="Notifications">
                  <div className="adm-dd__head">
                    <strong>Notifications</strong>
                    <button type="button" className="adm-link" onClick={markAllRead} disabled={unreadCount === 0}>Mark all as read</button>
                  </div>
                  <NotificationList items={notifications} onRead={markNotificationRead} limit={6} />
                </div>
              )}
            </div>

            {/* Admin profile */}
            <div className="adm-dd-wrap" ref={profileRef}>
              <button type="button" className="adm-profile" onClick={() => toggle('profile')} aria-expanded={menu === 'profile'} aria-label="Admin profile menu">
                <Avatar name={session.name} size="sm" />
                <span className="adm-profile__name">{session.name}</span>
                <ChevronDown size={16} aria-hidden="true" />
              </button>
              {menu === 'profile' && (
                <div className="adm-dd" role="menu">
                  <div className="adm-dd__profile">
                    <Avatar name={session.name} />
                    <div>
                      <strong>{session.name}</strong>
                      <small>{session.email}</small>
                      <small>{session.title}</small>
                    </div>
                  </div>
                  <button type="button" role="menuitem" className="adm-dd__item" onClick={() => navigate('/change-password')}>
                    <KeyRound size={16} aria-hidden="true" /> Change password
                  </button>
                  <button type="button" role="menuitem" className="adm-dd__item" onClick={() => { logout(); navigate('/login'); }}>
                    <LogOut size={16} aria-hidden="true" /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="adm-main">
          <Outlet />
        </main>
      </div>

      <div className="adm-toasts" aria-live="polite">
        {toast && (
          <div key={toast.id} className={`adm-toast adm-toast--${toast.tone}`} role="status">
            {toast.tone === 'warning' ? <AlertTriangle size={18} aria-hidden="true" /> : <CheckCircle2 size={18} aria-hidden="true" />}
            <span>{toast.message}</span>
            <button type="button" onClick={dismissToast} aria-label="Dismiss message"><X size={16} /></button>
          </div>
        )}
      </div>
    </div>
  );
}
