import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const [frames, setFrames] = useState([]);
  const [file, setFile] = useState(null);
  const navigate = useNavigate();
  
  // Ambil token untuk disertakan dalam setiap request API terproteksi
  const token = localStorage.getItem('adminToken');

  const fetchFrames = async () => {
    const res = await fetch('http://localhost:5000/api/frames');
    const data = await res.json();
    setFrames(data);
  };

  useEffect(() => { fetchFrames(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append('frame', file);

    const res = await fetch('http://localhost:5000/api/frames', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }, // KIRIM TOKEN DI SINI
      body: formData,
    });

    if (res.status === 401 || res.status === 403) {
      handleLogout();
    } else {
      setFile(null);
      fetchFrames();
    }
  };

  const handleDelete = async (filename) => {
    const res = await fetch(`http://localhost:5000/api/frames/${filename}`, { 
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` } // KIRIM TOKEN DI SINI
    });

    if (res.status === 401 || res.status === 403) handleLogout();
    else fetchFrames();
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/login');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Admin - Kelola Frame</h2>
        <button onClick={handleLogout} className="bg-gray-600 text-white px-4 py-1 rounded">Logout</button>
      </div>
      {/* Sisa kode form dan list frame sama seperti sebelumnya */}
      <form onSubmit={handleUpload} className="mb-8 flex gap-4">
        <input type="file" accept=".png" onChange={(e) => setFile(e.target.files[0])} className="border p-2" />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Upload PNG</button>
      </form>
      <div className="grid grid-cols-3 gap-4">
        {frames.map((frame) => (
          <div key={frame.name} className="border p-2 rounded text-center">
            <img src={frame.url} alt="frame" className="w-full h-32 object-contain bg-gray-200 mb-2" />
            <button onClick={() => handleDelete(frame.name)} className="bg-red-500 text-white px-2 py-1 rounded w-full">Hapus</button>
          </div>
        ))}
      </div>
    </div>
  );
}