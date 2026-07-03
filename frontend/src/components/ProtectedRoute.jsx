import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('adminToken');

  // Jika token tidak ada di localStorage, usir paksa ke halaman login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Jika ada token, izinkan masuk ke halaman komponen Admin
  return children;
}