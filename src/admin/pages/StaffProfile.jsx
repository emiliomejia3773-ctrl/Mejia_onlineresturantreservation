import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Power, Trash2, UserCheck, UserSearch, UserX } from 'lucide-react';
import ActivityList from '../components/ActivityList';
import Avatar from '../components/Avatar';
import StaffDialogs from '../components/StaffDialogs';
import StatusPill from '../components/StatusPill';
import { useAdmin } from '../AdminContext';
import { ROLE_INFO, formatDateTime, formatDay, tenure, timeAgo } from '../adminData';

export default function StaffProfile() {
  const { id } = useParams();
  const { staff, activity, setStaffActive, loading, session } = useAdmin();
  const [dialog, setDialog] = useState(null);
  const navigate = useNavigate();

  const person = staff.find((s) => s.id === id);

  // Employment timeline: hiring date + recorded actions + termination.
  const timeline = useMemo(() => {
    if (!person) return [];
    const items = activity
      .filter((a) => a.staffId === person.id && a.type !== 'signin')
      .map((a) => ({ id: a.id, type: a.type, text: a.text, at: a.at }));
    items.push({ id: 'hired', type: 'hire', text: `Hired as ${person.position}`, at: new Date(`${person.hiredAt}T09:00:00`).toISOString() });
    return items.sort((a, b) => b.at.localeCompare(a.at));
  }, [person, activity]);

  if (!person && loading) return null;
  if (!person) {
    return (
      <div className="adm-empty adm-empty--page">
        <UserSearch size={36} strokeWidth={1.4} aria-hidden="true" />
        <h3>Staff member not found</h3>
        <p>This profile does not exist. Please check the link or go back to the staff list.</p>
        <Link to="/admin/staff" className="adm-btn adm-btn--primary">Back to staff list</Link>
      </div>
    );
  }

  return (
    <>
      <Link to="/admin/staff" className="adm-back"><ArrowLeft size={16} aria-hidden="true" /> All staff</Link>

      <section className="adm-card adm-profilecard">
        <Avatar name={person.name} size="lg" />
        <div className="adm-profilecard__info">
          <h1>{person.name}</h1>
          <p>{person.position} · {person.role}</p>
          <div className="adm-profilecard__meta">
            <StatusPill status={person.status} />
            <span>{person.id}</span>
          </div>
        </div>
        {(session?.type === 'admin' || person.role !== 'Manager') && (
          <div className="adm-profilecard__actions">
            <button type="button" className="adm-btn adm-btn--outline" onClick={() => setDialog({ type: 'edit', person })}><Pencil size={16} /> Edit</button>
            {person.status === 'active' ? (
              <button type="button" className="adm-btn adm-btn--outline" onClick={() => setDialog({ type: 'deactivate', person })}><Power size={16} /> Deactivate</button>
            ) : (
              <button type="button" className="adm-btn adm-btn--outline" onClick={() => setStaffActive(person.id, true)}><UserCheck size={16} /> Activate</button>
            )}
            {session?.type === 'admin' && (
              <>
                <button type="button" className="adm-btn adm-btn--danger" onClick={() => setDialog({ type: 'terminate', person })}><UserX size={16} /> Terminate</button>
                <button type="button" className="adm-btn adm-btn--danger" onClick={() => setDialog({ type: 'delete', person })}><Trash2 size={16} /> Delete</button>
              </>
            )}
          </div>
        )}
      </section>

      <div className="adm-grid adm-grid--profile">
        <section className="adm-card">
          <h2 className="adm-card__title">Staff information</h2>
          <dl className="adm-dl">
            <div><dt>Email (login)</dt><dd>{person.email}</dd></div>
            <div><dt>Phone</dt><dd>{person.phone}</dd></div>
            <div><dt>Job position</dt><dd>{person.position}</dd></div>
            <div><dt>Staff role</dt><dd>{person.role}</dd></div>
            <div><dt>Hiring date</dt><dd>{formatDay(person.hiredAt)}</dd></div>
            <div><dt>Time with us</dt><dd>{tenure(person.hiredAt)}</dd></div>
            <div><dt>Account</dt><dd><StatusPill status={person.status} /></dd></div>
            <div><dt>Last login</dt><dd>{person.lastLogin ? `${formatDateTime(person.lastLogin)} (${timeAgo(person.lastLogin)})` : 'Has never signed in'}</dd></div>
          </dl>
          <p className="adm-help">{ROLE_INFO[person.role]}</p>
        </section>

        <section className="adm-card">
          <h2 className="adm-card__title">Employment timeline</h2>
          <ActivityList items={timeline.map((t) => ({ ...t, text: t.text }))} />
        </section>
      </div>

      <section className="adm-card adm-card--flush">
        <h2 className="adm-card__title adm-card__title--pad">Sign-in activity</h2>
        {person.signIns.length === 0 ? (
          <div className="adm-empty"><h3>No sign-ins yet</h3><p>{person.name.split(' ')[0]} has not signed in to their staff account.</p></div>
        ) : (
          <div className="adm-tablewrap">
            <table className="adm-table">
              <thead><tr><th>Date &amp; time</th><th>Result</th><th>Device</th></tr></thead>
              <tbody>
                {person.signIns.map((x) => (
                  <tr key={x.id}>
                    <td data-label="Date & time">{formatDateTime(x.at)}</td>
                    <td data-label="Result"><span className={`adm-pill adm-pill--${x.result === 'success' ? 'active' : 'terminated'}`}>{x.result === 'success' ? 'Success' : 'Failed'}</span></td>
                    <td data-label="Device">{x.device}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <StaffDialogs dialog={dialog} onClose={() => setDialog(null)} onRemoved={() => navigate('/admin/staff')} />
    </>
  );
}
