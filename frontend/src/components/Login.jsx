import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (res.ok) {
      // Simpan token token JWT ke localStorage browser
      localStorage.setItem('adminToken', data.token);
      navigate('/admin'); // Alihkan ke halaman admin
    } else {
      setError(data.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Login Admin Photo Box</h2>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <input type="text" placeholder="Username" onChange={e => setUsername(e.target.value)} className="w-full border p-2 mb-4 rounded" required />
        <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} className="w-full border p-2 mb-6 rounded" required />
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">Masuk</button>
      </form>
    </div>
  );
}