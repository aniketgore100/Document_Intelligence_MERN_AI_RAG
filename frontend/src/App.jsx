import { Navigate, Route, Routes } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Login from './pages/Login';
import RoleProtectedRoute from './components/UI/RoleProtectedRoute';
import ProtectedRoute from './components/UI/ProtectedRoute';
import AppLayout from './components/UI/AppLayout';
import Home from './pages/Home';
import { ROLES } from './constants/roles';
import AcceptInvite from './pages/AcceptInvite';
import DepartmentUsers from './pages/DepartmentUsers';
import OrgAdminHomeView from './components/home/OrgAdminHomeView';
import OrgAdminDocuments from './pages/OrgAdminDocuments';
import OrgAdminSettings from './pages/OrgAdminSettings';
import Organizations from './pages/Organizations';
import Department from './pages/Department';
import Profile from './pages/Profile';
import DocumentViewer from './pages/DocumentViewer';

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

          <Route element={<RoleProtectedRoute allowedRoles={[ROLES.ORG_ADMIN]} />}>
            <Route path="/departments" element={<OrgAdminHomeView />} />
            <Route path="/department/:orgId/:deptId" element={<Department />} />  
          </Route>
          <Route element={<RoleProtectedRoute allowedRoles={[ROLES.ORG_ADMIN, ROLES.DEPT_ADMIN]} />}>
            <Route path="/documents" element={<OrgAdminDocuments />} />
          </Route>
          <Route path="/documents/:id" element={<DocumentViewer />} />
          <Route path="/settings" element={<OrgAdminSettings />} />
          <Route path="/profile" element={<Profile />} />

          <Route element={<RoleProtectedRoute allowedRoles={[ROLES.DEPT_ADMIN]} />}>
            <Route path="/department/users" element={<DepartmentUsers />} />
          </Route>
    
          <Route element={<RoleProtectedRoute allowedRoles={[ROLES.GLOBAL_ADMIN]} />}>
            <Route path="/organization/:slug/:id" element={<Organizations />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={token ? '/home' : '/login'} replace />} />
    </Routes>
  );
};

export default App;
