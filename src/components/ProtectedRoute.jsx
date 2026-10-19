import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps a page that needs a login.
 * Logged-out visitors are sent to /login with the intended destination and a message,
 * so a successful login returns them to the page they asked for.
 */
export default function ProtectedRoute({ children, message = 'Please log in to continue with your reservation.' }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) return null; // still checking a saved login
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname, message }} />;
  }
  return children;
}
