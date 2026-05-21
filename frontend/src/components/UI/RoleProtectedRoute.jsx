import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

const RoleProtectedRoute = ({ allowedRoles = [] }) => {
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);

  if (!token) return <Navigate to="/login" replace />;

  const roleName = user?.roleName;
  if (!allowedRoles.includes(roleName)) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
};

export default RoleProtectedRoute;
