import { Link } from 'react-router-dom';
import { ArrowLeft, CalendarDays, LayoutDashboard, ListChecks, Table2 } from 'lucide-react';
import Logo from '../components/Logo';

const NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'reservations', label: 'Reservations', icon: ListChecks },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'tables', label: 'Tables', icon: Table2 },
];

export default function AdminLayout({ active, onChange, title, children }) {
  return (
    <div className="admin">
      <aside className="admin__sidebar">
        <div className="admin__brand"><Logo /></div>
        <nav aria-label="Admin sections" className="admin__nav">
          <Link to="/admin" className="admin__navitem"><ArrowLeft size={18} aria-hidden="true" /> <span>Admin home</span></Link>
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" className={`admin__navitem ${active === id ? 'is-active' : ''}`} onClick={() => onChange(id)} aria-current={active === id ? 'page' : undefined}>
              <Icon size={18} aria-hidden="true" /> <span>{label}</span>
            </button>
          ))}
        </nav>
        <Link to="/" className="admin__back"><ArrowLeft size={16} aria-hidden="true" /> <span>Back to website</span></Link>
      </aside>

      <div className="admin__main">
        <header className="admin__header"><h1>{title}</h1></header>
        {children}
      </div>
    </div>
  );
}
