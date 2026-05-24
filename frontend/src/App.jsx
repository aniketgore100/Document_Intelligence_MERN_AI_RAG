import { Navigate, Route, Routes } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Login from './pages/Login';
import RoleProtectedRoute from './components/UI/RoleProtectedRoute';
import ProtectedRoute from './components/UI/ProtectedRoute';
import RolesList from './pages/RoleList';
import AppLayout from './components/UI/AppLayout';
import Home from './pages/Home';
import { ROLES } from './constants/roles';
import AcceptInvite from './pages/AcceptInvite';

const App = () => {
  const token = useSelector((state) => state.auth.token);

  return (
    <Routes>
      <Route path="/" element={<Navigate to={token ? '/home' : '/login'} replace />} />
      <Route path="/login" element={token ? <Navigate to="/home" replace /> : <Login />} />
      <Route path="/invite/accept" element={<AcceptInvite />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/home" element={<Home />} />

          <Route element={<RoleProtectedRoute allowedRoles={[ROLES.GLOBAL_ADMIN]} />}>
            <Route path="/roles" element={<RolesList />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={token ? '/home' : '/login'} replace />} />
    </Routes>
  );
};

export default App;
