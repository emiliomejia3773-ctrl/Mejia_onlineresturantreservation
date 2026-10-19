import { useNavigate } from 'react-router-dom';
import ReservationForm from '../components/ReservationForm';
import SectionHeading from '../components/SectionHeading';
import { useAuth } from '../context/AuthContext';
import { useReservations } from '../context/ReservationContext';

export default function BookNow() {
  const { user } = useAuth();
  const { addReservation } = useReservations();
  const navigate = useNavigate();

  // Errors (e.g. "that time was just taken") bubble up to the form, which shows them.
  const handleSubmit = async (data) => {
    const reservation = await addReservation(data);
    navigate('/booking-confirmation', { state: { reservation } });
  };

  return (
    <section className="section booking-page">
      <div className="container">
        <SectionHeading eyebrow="Reservations" title="Book your table">
          Welcome, {user.name.split(' ')[0]}. Choose a date, time and seating — we’ll take care of the rest.
        </SectionHeading>
        <ReservationForm user={user} onSubmit={handleSubmit} />
      </div>
    </section>
  );
}
