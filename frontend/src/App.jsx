import { Navigate, Route, Routes } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Login from './pages/Login';
import Register from './pages/Register';
import Documents from './pages/Documents';

const App = () => {
  const token = useSelector((state) => state.auth.token);

  return (
    <Routes>
      <Route path="/" element={<Navigate to={token ? '/documents' : '/login'} replace />} />
      <Route path="/login" element={token ? <Navigate to="/documents" replace /> : <Login />} />
      <Route path="/register" element={token ? <Navigate to="/documents" replace /> : <Register />} />
      <Route path="/documents" element={token ? <Documents /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to={token ? '/documents' : '/login'} replace />} />
    </Routes>
  );
};

export default App;
