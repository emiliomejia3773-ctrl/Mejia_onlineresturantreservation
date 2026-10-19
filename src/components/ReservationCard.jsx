import { Armchair, CalendarDays, Clock, Users } from 'lucide-react';
import Button from './Button';
import StatusBadge from './StatusBadge';
import { ACTIVE_STATUSES, areaName, formatDate, formatTime } from '../data/reservationData';

export default function ReservationCard({ reservation, onView, onCancel, editTo }) {
  const canCancel = onCancel && ['pending', 'confirmed'].includes(reservation.status);
  return (
    <article className="res-card">
      <div className="res-card__top">
        <div>
          <div className="res-card__ref">{reservation.reference}</div>
          <div className="res-card__date">{formatDate(reservation.date, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        </div>
        <StatusBadge status={reservation.status} />
      </div>

      <div className="res-card__meta">
        <span><Clock size={15} aria-hidden="true" /> {formatTime(reservation.time)}</span>
        <span><Users size={15} aria-hidden="true" /> {reservation.guests} {reservation.guests === 1 ? 'guest' : 'guests'}</span>
        <span><Armchair size={15} aria-hidden="true" /> {areaName(reservation.area)}</span>
        {reservation.occasion && reservation.occasion !== 'None' && (
          <span><CalendarDays size={15} aria-hidden="true" /> {reservation.occasion}</span>
        )}
      </div>

      <div className="res-card__actions">
        <Button variant="outline" size="sm" onClick={() => onView(reservation)}>View details</Button>
        {editTo && <Button to={editTo} variant="outline" size="sm">Change</Button>}
        {canCancel && ACTIVE_STATUSES.includes(reservation.status) && (
          <Button variant="danger" size="sm" onClick={() => onCancel(reservation)}>Cancel</Button>
        )}
      </div>
    </article>
  );
}
