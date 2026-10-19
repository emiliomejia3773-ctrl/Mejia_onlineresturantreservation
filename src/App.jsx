import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Menu from './pages/Menu';
import About from './pages/About';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import BookNow from './pages/BookNow';
import BookingConfirmation from './pages/BookingConfirmation';
import CustomerDashboard from './pages/CustomerDashboard';
import EditReservation from './pages/EditReservation';
import AdminDashboard from './pages/AdminDashboard';
import ChangePassword from './pages/ChangePassword';
import { AdminProvider } from './admin/AdminContext';
import AdminShell from './admin/AdminShell';
import AdminOverview from './admin/pages/AdminOverview';
import StaffList from './admin/pages/StaffList';
import StaffProfile from './admin/pages/StaffProfile';
import { AdminOnly, RequireAdmin } from './admin/components/AdminGuards';

function SiteLayout() {
  return (
    <>
      <Navbar />
      <main className="page-main page-fade">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <AdminProvider>
      <ScrollToTop />
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/about" element={<About />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/book-now" element={<ProtectedRoute><BookNow /></ProtectedRoute>} />
          <Route path="/booking-confirmation" element={<ProtectedRoute><BookingConfirmation /></ProtectedRoute>} />
          <Route path="/reservations/:id/edit" element={<ProtectedRoute message="Please log in to change your reservation."><EditReservation /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute message="Please log in to view your reservations."><CustomerDashboard /></ProtectedRoute>} />
        </Route>

        {/* Admin area: the API enforces who may do what; these guards only decide what to show. */}
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />
        <Route path="/admin" element={<RequireAdmin><AdminShell /></RequireAdmin>}>
          <Route index element={<AdminOverview />} />
          <Route path="staff" element={<AdminOnly><StaffList /></AdminOnly>} />
          <Route path="staff/:id" element={<AdminOnly><StaffProfile /></AdminOnly>} />
        </Route>
        <Route path="/admin/reservations" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AdminProvider>
  );
}
