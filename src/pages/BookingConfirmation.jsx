import { Navigate, useLocation } from 'react-router-dom';
import { CheckCircle2, Clock3, Printer } from 'lucide-react';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { RESTAURANT } from '../data/siteData';
import { areaName, formatDate, formatTime } from '../data/reservationData';

export default function BookingConfirmation() {
  const { state } = useLocation();
  const r = state?.reservation;
  const edited = Boolean(state?.edited);

  // Opened directly (e.g. after a refresh): nothing to confirm.
  if (!r) return <Navigate to="/dashboard" replace />;

  const confirmed = r.status === 'confirmed';

  return (
    <section className="section confirm">
      <div className="container confirm__wrap">
        <div className="confirm__card">
          <div className={`confirm__icon ${confirmed ? '' : 'confirm__icon--pending'}`}>
            {confirmed ? <CheckCircle2 size={44} strokeWidth={1.4} /> : <Clock3 size={44} strokeWidth={1.4} />}
          </div>
          <span className="eyebrow">{edited ? 'Reservation updated' : confirmed ? 'Reservation confirmed' : 'Request received'}</span>
          <h1>{confirmed ? 'See you soon' : 'Thank you'}, {r.name.split(' ')[0]}.</h1>
          <p className="lead" style={{ marginInline: 'auto' }}>
            {confirmed
              ? 'Your table is booked. Keep your reference number handy. We do not send confirmation emails yet.'
              : 'Your request is with our team, who will confirm it shortly. You can follow its status in your dashboard.'}
          </p>

          <div className="confirm__ref">
            <span>Reference number</span>
            <strong>{r.reference}</strong>
          </div>

          <dl className="detail-list confirm__details">
            <div><dt>Status</dt><dd><StatusBadge status={r.status} /></dd></div>
            <div><dt>Date</dt><dd>{formatDate(r.date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</dd></div>
            <div><dt>Time</dt><dd>{formatTime(r.time)}</dd></div>
            <div><dt>Guests</dt><dd>{r.guests}</dd></div>
            <div><dt>Seating</dt><dd>{areaName(r.area)}</dd></div>
            {r.occasion && r.occasion !== 'None' && <div><dt>Occasion</dt><dd>{r.occasion}</dd></div>}
            {r.dietary && <div><dt>Dietary</dt><dd>{r.dietary}</dd></div>}
            {r.requests && <div><dt>Requests</dt><dd>{r.requests}</dd></div>}
          </dl>

          <p className="confirm__address">{RESTAURANT.name} {RESTAURANT.tagline} · {RESTAURANT.address}, {RESTAURANT.city}</p>

          <div className="confirm__actions">
            <Button to="/dashboard" variant="primary">View my reservations</Button>
            <Button to="/" variant="outline">Back to home</Button>
            <Button variant="outline" onClick={() => window.print()}><Printer size={15} /> Print</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
