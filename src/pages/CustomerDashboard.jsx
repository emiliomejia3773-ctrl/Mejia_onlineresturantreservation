import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarX2, CheckCircle2, LogOut } from 'lucide-react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ReservationCard from '../components/ReservationCard';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useReservations } from '../context/ReservationContext';
import { ACTIVE_STATUSES, areaName, formatDate, formatTime, todayISO } from '../data/reservationData';

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const { reservations, cancelReservation } = useReservations();
  const navigate = useNavigate();

  const [tab, setTab] = useState('upcoming');
  const [viewing, setViewing] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const today = todayISO();
  const { upcoming, history } = useMemo(() => {
    const sorted = [...reservations].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
    return {
      upcoming: sorted.filter((r) => r.date >= today && ACTIVE_STATUSES.includes(r.status)),
      history: sorted.filter((r) => !(r.date >= today && ACTIVE_STATUSES.includes(r.status))).reverse(),
    };
  }, [reservations, today]);

  const list = tab === 'upcoming' ? upcoming : history;

  const [cancelError, setCancelError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => setCancelError(''), [cancelling]);

  const confirmCancel = async () => {
    setBusy(true);
    setCancelError('');
    const result = await cancelReservation(cancelling.id);
    setBusy(false);
    if (!result.ok) {
      setCancelError(result.error);
      return;
    }
    setToast(`Reservation ${cancelling.reference} was cancelled.`);
    setCancelling(null);
    setViewing(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const canCancel = (r) => ['pending', 'confirmed'].includes(r.status);

  return (
    <section className="section dashboard">
      <div className="container">
        <div className="dashboard__head">
          <div>
            <span className="eyebrow">My account</span>
            <h1>Welcome, {user.name.split(' ')[0]}</h1>
          </div>
          <div className="dashboard__head-actions">
            <Button to="/book-now" variant="primary">New reservation</Button>
            <Button variant="outline" onClick={handleLogout}><LogOut size={15} /> Log out</Button>
          </div>
        </div>

        {toast && <div className="alert alert--success" role="status" style={{ marginBottom: '1.5rem' }}><CheckCircle2 size={18} /> {toast}</div>}

        <div className="dashboard__grid">
          <aside className="profile">
            <div className="profile__avatar" aria-hidden="true">{user.name.charAt(0)}</div>
            <h3>{user.name}</h3>
            <dl className="detail-list">
              <div><dt>Email</dt><dd>{user.email}</dd></div>
              <div><dt>Phone</dt><dd>{user.phone}</dd></div>
              <div><dt>Member since</dt><dd>{user.memberSince}</dd></div>
              <div><dt>Upcoming</dt><dd>{upcoming.length}</dd></div>
            </dl>
          </aside>

          <div>
            <div className="filters" role="tablist" aria-label="Reservation lists">
              <button type="button" role="tab" aria-selected={tab === 'upcoming'} className={`filter ${tab === 'upcoming' ? 'is-active' : ''}`} onClick={() => setTab('upcoming')}>Upcoming ({upcoming.length})</button>
              <button type="button" role="tab" aria-selected={tab === 'history'} className={`filter ${tab === 'history' ? 'is-active' : ''}`} onClick={() => setTab('history')}>History ({history.length})</button>
            </div>

            {list.length === 0 ? (
              <div className="empty">
                <CalendarX2 size={34} strokeWidth={1.3} />
                <h4>{tab === 'upcoming' ? 'No upcoming reservations' : 'No past reservations yet'}</h4>
                <p>{tab === 'upcoming' ? 'Ready for a night out? Reserve your table in a minute.' : 'Your completed and cancelled bookings will appear here.'}</p>
                {tab === 'upcoming' && <div style={{ marginTop: '1.2rem' }}><Button to="/book-now" variant="primary" size="sm">Book a table</Button></div>}
              </div>
            ) : (
              <div className="res-list">
                {list.map((r) => (
                  <ReservationCard key={r.id} reservation={r} onView={setViewing} onCancel={canCancel(r) && tab === 'upcoming' ? setCancelling : undefined} editTo={canCancel(r) && tab === 'upcoming' ? `/reservations/${r.id}/edit` : undefined} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {viewing && (
        <Modal
          title="Reservation details"
          onClose={() => setViewing(null)}
          actions={
            <>
              {canCancel(viewing) && viewing.date >= today && <Button to={`/reservations/${viewing.id}/edit`} variant="outline" size="sm">Change reservation</Button>}
              {canCancel(viewing) && viewing.date >= today && <Button variant="danger" size="sm" onClick={() => setCancelling(viewing)}>Cancel reservation</Button>}
              <Button variant="outline" size="sm" onClick={() => setViewing(null)}>Close</Button>
            </>
          }
        >
          <dl className="detail-list">
            <div><dt>Reference</dt><dd>{viewing.reference}</dd></div>
            <div><dt>Status</dt><dd><StatusBadge status={viewing.status} /></dd></div>
            <div><dt>Date</dt><dd>{formatDate(viewing.date)}</dd></div>
            <div><dt>Time</dt><dd>{formatTime(viewing.time)}</dd></div>
            <div><dt>Guests</dt><dd>{viewing.guests}</dd></div>
            <div><dt>Seating</dt><dd>{areaName(viewing.area)}</dd></div>
            {viewing.occasion && viewing.occasion !== 'None' && <div><dt>Occasion</dt><dd>{viewing.occasion}</dd></div>}
            {viewing.dietary && <div><dt>Dietary</dt><dd>{viewing.dietary}</dd></div>}
            {viewing.requests && <div><dt>Requests</dt><dd>{viewing.requests}</dd></div>}
          </dl>
        </Modal>
      )}

      {cancelling && (
        <Modal
          title="Cancel this reservation?"
          onClose={() => setCancelling(null)}
          actions={
            <>
              <Button variant="outline" size="sm" onClick={() => setCancelling(null)}>Keep reservation</Button>
              <Button variant="danger" size="sm" onClick={confirmCancel} disabled={busy}>{busy ? 'Cancelling…' : 'Yes, cancel it'}</Button>
            </>
          }
        >
          <p>
            {cancelling.reference} · {formatDate(cancelling.date)} at {formatTime(cancelling.time)} for {cancelling.guests}. This cannot be undone.
          </p>
          {cancelError && <p className="field__error" role="alert">{cancelError}</p>}
        </Modal>
      )}
    </section>
  );
}
