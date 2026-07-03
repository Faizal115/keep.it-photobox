import React from 'react'; // <-- TAMBAHKAN BARIS INI
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PhotoBooth from './components/PhotoBooth.jsx';
import Admin from './components/Admin';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Rute Publik: Bisa diakses klien umum */}
        <Route path="/" element={<PhotoBooth />} />
        
        {/* Rute Login */}
        <Route path="/login" element={<Login />} />

        {/* Rute Admin: DILINDUNGI oleh ProtectedRoute */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}