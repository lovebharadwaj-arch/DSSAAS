import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/authContext";

const ProtectedRoute = () => {
  const { user, token } = useAuth();
  const location = useLocation();

  // No authenticated user or token: redirect to login.
  if (!user || !token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Allow access to the requested protected page.
  return <Outlet />;
};

export default ProtectedRoute;
