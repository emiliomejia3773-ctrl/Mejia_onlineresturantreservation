import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ReservationForm from '../components/ReservationForm';
import SectionHeading from '../components/SectionHeading';
import { useAuth } from '../context/AuthContext';
import { useReservations } from '../context/ReservationContext';

/** Change the date, time, party size, seating or notes of one of my upcoming reservations. */
export default function EditReservation() {
  const { id } = useParams();
  const { user } = useAuth();
  const { reservations, loading, updateReservation } = useReservations();
  const navigate = useNavigate();

  const reservation = reservations.find((r) => r.id === id);

  if (loading && !reservation) return null; // still loading my reservations
  if (!reservation || !['pending', 'confirmed'].includes(reservation.status)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Errors (e.g. "that time is not available") bubble up to the form, which shows them.
  const handleSubmit = async (data) => {
    const updated = await updateReservation(reservation.id, data);
    navigate('/booking-confirmation', { state: { reservation: updated, edited: true } });
  };

  return (
    <section className="section booking-page">
      <div className="container">
        <Link to="/dashboard" className="auth__back"><ArrowLeft size={15} /> Back to my reservations</Link>
        <SectionHeading eyebrow={`Reference ${reservation.reference}`} title="Change your reservation">
          Pick a new date, time or seating, or update your notes. Changes are possible up to 4 hours before your booking.
        </SectionHeading>
        <ReservationForm user={user} initial={reservation} submitLabel="Save changes" onSubmit={handleSubmit} />
      </div>
    </section>
  );
}
