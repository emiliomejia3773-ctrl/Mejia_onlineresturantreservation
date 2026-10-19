import { Navigate, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAdmin } from '../AdminContext';
import { useAuth } from '../../context/AuthContext';

/** Sends visitors who are not signed in as admin or staff to the login page. (The API enforces access too.) */
export function RequireAdmin({ children }) {
  const { session } = useAdmin();
  const { ready } = useAuth();
  const location = useLocation();
  if (!ready) return null; // still checking a saved login
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname, message: 'Please log in with an admin or staff account to open the admin area.' }} />;
  }
  // A newly hired staff member must replace the temporary password before using the dashboard.
  if (session.mustChangePassword) return <Navigate to="/change-password" replace />;
  return children;
}

/** Only the administrator and Manager accounts may open these pages. */
export function AdminOnly({ children }) {
  const { session } = useAdmin();
  if (!session?.canManageStaff) {
    return (
      <div className="adm-empty adm-empty--page">
        <Lock size={36} strokeWidth={1.4} aria-hidden="true" />
        <h3>Managers and administrators only</h3>
        <p>Your account cannot open Staff Management.</p>
        <Link to="/admin" className="adm-btn adm-btn--primary">Back to dashboard</Link>
      </div>
    );
  }
  return children;
}
