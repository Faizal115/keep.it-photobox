import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';

export default function PhotoBooth() {
  const videoRef = useRef(null);
  const stripRef = useRef(null);
  const [stream, setStream] = useState(null);
  
  const [isFlash, setIsFlash] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  
  // FITUR BARU: State Manajemen Kontrol Foto & Timer
  const [countdown, setCountdown] = useState(0);
  const [isCounting, setIsCounting] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null); // Menyimpan indeks foto yang mau di-retake

  const [activeTab, setActiveTab] = useState('frame'); 
  const [selectedFilter, setSelectedFilter] = useState('none'); 
  const [selectedFrame, setSelectedFrame] = useState('theme-polos'); 
  const [selectedLayout, setSelectedLayout] = useState(4); 
  const [selectedPaperShape, setSelectedPaperShape] = useState('rounded-none');
  const [customText, setCustomText] = useState('⭐ KEEP.IT STAMP ⭐'); 
  
  const [stickers, setStickers] = useState([]);

  const ALL_STICKERS = [
    '💖', '✨', '👑', '😎', '🎀', '🔥', '⭐', '🎈', 
    '🎉', '🦋', '🌸', '🍕', '🌈', '👽', '👻', '👾', 
    '🍒', '🍓', '🍉', '🌻', '🌵', '🐾', '💋', '💎',
    '🎸', '🕹️', '📼', '🛼', '🛹', '🍟', '🍩', '🥑',
    '🍀', '🍄', '🌙', '☁️', '🚀', '🛸', '🎨', '🎲'
  ];

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Gagal mengakses kamera:", err);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // FITUR BARU: Efek Penghitung Waktu (Timer Otomatis 3 Detik)
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && isCounting) {
      executeSnap();
      setIsCounting(false);
    }
  }, [countdown, isCounting]);

  // Handler Tombol Kamera Utama (Memicu Timer)
  const takeSnap = () => {
    if (isCounting) return;
    setCountdown(3); // Set waktu timer 3 detik di sini
    setIsCounting(true);
  };

  // Fungsi Eksekusi Ambil Gambar Asli Anda (Dipanggil setelah timer habis)
  const executeSnap = () => {
    if (!videoRef.current || videoRef.current.videoWidth === 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // Mirroring
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    // Terapkan filter langsung ke Canvas Context sebelum menggambar
    let canvasFilter = 'none';
    switch(selectedFilter) {
      case 'bw': canvasFilter = 'grayscale(1) contrast(1.25) brightness(0.9)'; break;
      case 'sepia': canvasFilter = 'sepia(1) contrast(1.1) brightness(0.95)'; break;
      case 'vintage': canvasFilter = 'contrast(0.9) saturate(1.5) brightness(1.05) hue-rotate(15deg)'; break;
      case 'lofi': canvasFilter = 'contrast(0.75) saturate(1.1) sepia(0.3) brightness(1.1)'; break;
      case 'cyber': canvasFilter = 'contrast(1.5) saturate(2) hue-rotate(90deg) brightness(0.9)'; break;
      case 'warm': canvasFilter = 'sepia(0.4) contrast(1.1) saturate(1.5) hue-rotate(-10deg)'; break;
      case 'cool': canvasFilter = 'saturate(0.5) contrast(1.2) hue-rotate(180deg) brightness(1.1)'; break;
      case 'dramatic': canvasFilter = 'contrast(1.5) saturate(0.5) brightness(0.75)'; break;
      case 'invert': canvasFilter = 'invert(1) contrast(1.25)'; break;
      default: canvasFilter = 'none';
    }
    ctx.filter = canvasFilter;

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.95);

    setIsFlash(true);
    setTimeout(() => setIsFlash(false), 150);

    const newPhoto = { filter: 'none', image: photoDataUrl };

    // FITUR BARU: Logika Menyisipkan Foto Baru atau Mengganti (Retake) Foto Spesifik
    if (selectedSlot !== null) {
      const updatedPhotos = [...capturedPhotos];
      updatedPhotos[selectedSlot] = newPhoto;
      setCapturedPhotos(updatedPhotos);
      setSelectedSlot(null); // Reset slot kembali normal setelah selesai retake
    } else {
      if (capturedPhotos.length < selectedLayout) {
        setCapturedPhotos([...capturedPhotos, newPhoto]); 
      } else {
        setCapturedPhotos([newPhoto]);
      }
    }
  };

  // FITUR BARU: Mengubah Letak/Posisi Urutan Foto (Ke atas / Ke bawah)
  const movePhoto = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= capturedPhotos.length) return;
    
    const updatedPhotos = [...capturedPhotos];
    const temp = updatedPhotos[index];
    updatedPhotos[index] = updatedPhotos[targetIndex];
    updatedPhotos[targetIndex] = temp;
    setCapturedPhotos(updatedPhotos);
  };

  const handleDownload = async () => {
    if (!stripRef.current) return;
    
    const originalClasses = stripRef.current.className;
    stripRef.current.classList.remove('rotate-1', 'hover:rotate-0');

    try {
      const canvas = await html2canvas(stripRef.current, {
        scale: 3, 
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: null,
        imageTimeout: 0
      });
      
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `RetroBooth-${Date.now()}.png`;
      link.click();
    } catch (err) {
      console.error("Gagal mengunduh gambar:", err);
    } finally {
      stripRef.current.className = originalClasses;
    }
  };

  const handleLayoutChange = (layoutNumber) => {
    setSelectedLayout(layoutNumber);
    setCapturedPhotos([]); 
    setStickers([]); 
    setSelectedSlot(null);
  };

  const handleAddSticker = (emoji) => {
    if (stickers.length >= 15) return; 
    const edge = Math.floor(Math.random() * 4);
    let x, y;

    switch(edge) {
      case 0: x = Math.floor(Math.random() * 80) + 10; y = Math.floor(Math.random() * 6) + 1; break;
      case 1: x = Math.floor(Math.random() * 80) + 10; y = Math.floor(Math.random() * 6) + 90; break;
      case 2: x = Math.floor(Math.random() * 6) + 1; y = Math.floor(Math.random() * 70) + 15; break;
      case 3: x = Math.floor(Math.random() * 6) + 84; y = Math.floor(Math.random() * 70) + 15; break;
      default: x = 50; y = 50;
    }

    setStickers([...stickers, { id: Date.now(), emoji, x, y, rotation: Math.floor(Math.random() * 40) - 20 }]);
  };

  const handleRemoveSticker = (id) => {
    setStickers(stickers.filter(s => s.id !== id));
  };

  const getFilterClass = (filter) => {
    switch(filter) {
      case 'bw': return 'grayscale contrast-125 brightness-90';
      case 'sepia': return 'sepia contrast-110 brightness-95';
      case 'vintage': return 'contrast-90 saturate-150 brightness-105 hue-rotate-15';
      case 'lofi': return 'contrast-75 saturate-110 sepia-[.30] brightness-110';
      case 'cyber': return 'contrast-150 saturate-200 hue-rotate-90 brightness-90';
      case 'warm': return 'sepia-[.40] contrast-110 saturate-150 hue-rotate-[-10deg]';
      case 'cool': return 'saturate-50 contrast-120 hue-rotate-[180deg] brightness-110';
      case 'dramatic': return 'contrast-150 saturate-50 brightness-75 grayscale-[.3]';
      case 'invert': return 'invert contrast-125';
      default: return 'contrast-105 brightness-100';
    }
  };

  const getThemeClass = () => {
    switch(selectedFrame) {
      case 'theme-polos': return 'bg-white text-stone-800 border-stone-200';
      case 'theme-grid': return 'bg-[#faf9f6] bg-[linear-gradient(#d5bdaf_1px,transparent_1px),linear-gradient(90deg,#d5bdaf_1px,transparent_1px)] bg-[size:15px_15px] text-stone-800 border-stone-300';
      case 'theme-polka': return 'bg-[#ffe5ec] bg-[radial-gradient(#ffb3c6_3px,transparent_3px)] bg-[size:16px_16px] text-rose-900 border-rose-300';
      case 'theme-y2k': return 'bg-gradient-to-br from-cyan-200 via-fuchsia-200 to-yellow-200 text-purple-900 border-fuchsia-300';
      case 'theme-vintage': return 'bg-[#d4c0a1] bg-[radial-gradient(#8c7b65_1px,transparent_1px)] bg-[size:20px_20px] text-[#4a3c2b] border-[#8c7b65]';
      case 'theme-blueprint': return 'bg-[#1e3a8a] bg-[linear-gradient(#60a5fa_1px,transparent_1px),linear-gradient(90deg,#60a5fa_1px,transparent_1px)] bg-[size:15px_15px] text-white border-blue-400';
      case 'theme-neon': return 'bg-gray-900 text-green-400 border-green-500 shadow-[inset_0_0_15px_rgba(34,197,94,0.3)]';
      case 'theme-notebook': return 'bg-white bg-[linear-gradient(transparent_95%,#cbd5e1_5%)] bg-[size:100%_20px] text-blue-900 border-gray-300 border-l-[10px] border-l-red-400';
      case 'theme-holo': return 'bg-gradient-to-tr from-[#a18cd1] via-[#fbc2eb] to-[#8fd3f4] text-purple-900 border-white/70 shadow-[inset_0_0_20px_rgba(255,255,255,0.8)]';
      case 'theme-floral': return 'bg-[#e9f5db] bg-[radial-gradient(#cfe1b9_2px,transparent_2px)] bg-[size:14px_14px] text-[#718355] border-[#8a9a5b]';
      case 'theme-cinema': return 'bg-stone-950 text-amber-100 border-stone-900 px-7 overflow-hidden'; 
      
      default: return 'bg-white text-stone-800 border-stone-200'; 
    }
  };

  return (
    <div className="min-h-screen bg-[#3e2723] bg-gradient-to-b from-[#4e342e] to-[#2d1b18] flex flex-col lg:flex-row items-center justify-center p-4 lg:p-6 gap-6 font-mono relative select-none overflow-x-hidden pb-12">
      
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[repeating-linear-gradient(45deg,#000_0,#000_2px,transparent_2px,transparent_15px)] z-0"></div>
      <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-red-800 via-red-900 to-[#3e0c0c] border-b-[6px] border-amber-600/50 shadow-[0_20px_40px_rgba(0,0,0,0.8)] z-30 rounded-b-[40px]"></div>
      
      <div className="absolute top-6 inset-x-0 flex justify-center z-40 pointer-events-none">
        <div className="bg-amber-100 px-8 py-2 rounded-full border-4 border-amber-600 shadow-[0_5px_20px_rgba(217,119,6,0.6)] flex items-center gap-4">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
          <h2 className="text-amber-900 font-black tracking-widest text-sm lg:text-base uppercase">📷 Keep.it Studio 📷</h2>
          <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
        </div>
      </div>

      <div className="absolute top-0 left-0 bottom-0 w-8 lg:w-16 bg-gradient-to-r from-[#2a0808] via-red-900 to-red-800 border-r-4 border-amber-600/30 shadow-[15px_0_30px_rgba(0,0,0,0.7)] z-10"></div>
      <div className="absolute top-0 right-0 bottom-0 w-8 lg:w-16 bg-gradient-to-l from-[#2a0808] via-red-900 to-red-800 border-l-4 border-amber-600/30 shadow-[-15px_0_30px_rgba(0,0,0,0.7)] z-10"></div>

      {/* ========================================================================= */}
      {/* HIASAN DEKORASI: BRAND SOSMED & KAMERA (TRANSPARAN SEUTUHNYA & STATIS)    */}
      {/* ========================================================================= */}
      
      {/* Kolom Dekorasi Sisi Kiri (Format Zig-Zag agak menjorok ke tengah) */}
      <div className="hidden xl:flex fixed left-[11%] top-28 bottom-12 w-36 flex-col items-start justify-around z-10 pointer-events-none text-white/10 select-none">
        {/* Ikon Kamera Klasik */}
        <div className="pl-16 rotate-6">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
        </div>
        {/* Ikon Instagram Murni Transparan */}
        <div className="pl-6 -rotate-12">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
        </div>
        {/* Ikon Camcorder */}
        <div className="pl-20 rotate-12">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
        </div>
        {/* Ikon WhatsApp/Chat Murni Transparan */}
        <div className="pl-8 rotate-0">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
        </div>
        {/* Ikon Image Box */}
        <div className="pl-14 -rotate-6">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
        </div>
      </div>

      {/* Kolom Dekorasi Sisi Kanan (Format Zig-Zag agak menjorok ke tengah) */}
      <div className="hidden xl:flex fixed right-[11%] top-28 bottom-12 w-36 flex-col items-end justify-around z-10 pointer-events-none text-white/10 select-none">
        {/* Ikon Instagram Murni Transparan */}
        <div className="pr-16 -rotate-6">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
        </div>
        {/* Ikon WhatsApp/Chat Murni Transparan */}
        <div className="pr-6 rotate-12">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
        </div>
        {/* Ikon Lensa/Aperture */}
        <div className="pr-20 -rotate-12">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m12 2-6.5 9h13Z"/><path d="M12 22s5-4.85 5-9H7c0 4.15 5 9 5 9Z"/></svg>
        </div>
        {/* Ikon Kamera */}
        <div className="pr-8 rotate-6">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
        </div>
        {/* Ikon Image Box */}
        <div className="pr-14 rotate-0">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
        </div>
      </div>

      {/* ========================================================================= */}

      {isFlash && <div className="absolute inset-0 bg-white z-50 animate-fade-out pointer-events-none"></div>}

      <div className="w-full max-w-xl bg-[#f5ebe0] rounded-3xl p-4 lg:p-5 border-8 border-[#d5bdaf] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] text-stone-800 relative z-20 mt-10 lg:mt-6">
        
        <div className="flex justify-between items-center bg-[#edede9] p-2 rounded-xl border-2 border-[#d5bdaf] mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
            <span className="text-[10px] font-black uppercase tracking-wider text-stone-600">
              {selectedSlot !== null ? `🔄 EDIT SLOT FOTO KE-${selectedSlot + 1}` : '🔴 LIVE VIEW CAMERA'}
            </span>
          </div>
          <h1 className="text-base font-black tracking-widest text-[#656d4a] bg-[#e3d5ca] px-3 py-0.5 rounded-lg border border-[#d5bdaf]">✨ PHOTO-BOX ✨</h1>
        </div>

        {/* FITUR BARU: Overlay Animasi Angka Hitung Mundur (Timer) */}
        <div className="relative aspect-[4/3] w-full max-h-[40vh] mx-auto overflow-hidden bg-neutral-900 border-4 border-[#e3d5ca] shadow-[inset_0_4px_10px_rgba(0,0,0,0.8)] rounded-xl">
          {countdown > 0 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30 select-none pointer-events-none">
              <span className="text-7xl font-black text-amber-400 animate-bounce tracking-tighter">{countdown}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%] shadow-[inset_0_0_40px_rgba(0,0,0,0.9)] z-20 pointer-events-none"></div>
          <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover relative z-10 transition-all duration-200 ${getFilterClass(selectedFilter)}`} style={{ transform: 'scaleX(-1)' }}></video>
        </div>

        <div className="mt-3 bg-[#edede9] p-2 rounded-xl border-2 border-[#d5bdaf] flex flex-col gap-2">
          <div className="flex flex-wrap gap-1 border-b-2 border-[#d5bdaf] pb-2 justify-center">
            {[
              { id: 'frame', label: '🖼️ Tema' },
              { id: 'shape', label: '✂️ Bentuk' }, 
              { id: 'filter', label: '🎨 Filter' },
              { id: 'layout', label: '📱 Layout' },
              { id: 'sticker', label: '🧸 Stiker' },
              { id: 'text', label: '✍️ Teks' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-1 px-1.5 sm:px-2 text-[9px] sm:text-[10px] font-black uppercase tracking-wider rounded-md transition-all ${
                  activeTab === tab.id ? 'bg-[#656d4a] text-white shadow-inner' : 'bg-transparent text-stone-500 hover:bg-stone-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="max-h-[140px] overflow-y-auto overflow-x-hidden flex items-start justify-center p-1 scrollbar-hide">
            {activeTab === 'frame' && (
              <div className="w-full grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {[
                  { id: 'theme-polos', name: 'Putih Polos' }, 
                  { id: 'theme-grid', name: 'Jurnal Grid' }, 
                  { id: 'theme-polka', name: 'Polkadot' }, 
                  { id: 'theme-y2k', name: 'Y2K Aura' }, 
                  { id: 'theme-vintage', name: 'Kertas Usang' }, 
                  { id: 'theme-blueprint', name: 'Blue Print' },
                  { id: 'theme-neon', name: 'Neon Dark' },
                  { id: 'theme-notebook', name: 'Buku Tulis' }, 
                  { id: 'theme-holo', name: 'Hologram' }, 
                  { id: 'theme-floral', name: 'Floral' },
                  { id: 'theme-cinema', name: 'Roll Bioskop' }
                ].map((fr) => (
                  <button key={fr.id} onClick={() => setSelectedFrame(fr.id)} className={`py-2 px-1 rounded-lg text-[9px] sm:text-[10px] font-bold border-2 ${selectedFrame === fr.id ? 'bg-[#656d4a] text-white border-[#414833]' : 'bg-white border-[#d5bdaf] text-stone-700'}`}>
                    {fr.name}
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'shape' && (
              <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: 'rounded-none', name: 'Klasik Kotak' }, 
                  { id: 'rounded-2xl', name: 'Sudut Lembut' },
                  { id: 'rounded-[45px]', name: 'Kapsul Modern' },
                  { id: 'rounded-[40px] rounded-br-none', name: 'Chat Bubble' },
                  { id: 'rounded-tr-[40px] rounded-bl-[40px] rounded-tl-sm rounded-br-sm', name: 'Tiket Retro' },
                  { id: 'rounded-t-[50px] rounded-b-md', name: 'Kubah' },
                  { id: 'rounded-tl-[50px] rounded-br-[50px] rounded-tr-md rounded-bl-md', name: 'Bentuk Daun' },
                  { id: 'rounded-b-[50px] rounded-t-md', name: 'Pita Bawah' }
                ].map((sh) => (
                  <button key={sh.id} onClick={() => setSelectedPaperShape(sh.id)} className={`py-2 px-1 rounded-lg text-[9px] sm:text-[10px] font-bold border-2 text-center flex items-center justify-center ${selectedPaperShape === sh.id ? 'bg-[#656d4a] text-white border-[#414833]' : 'bg-white border-[#d5bdaf] text-stone-700'}`}>
                    {sh.name}
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'filter' && (
              <div className="w-full grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {[
                  { id: 'none', name: 'Asli' }, { id: 'vintage', name: 'Klasik' }, 
                  { id: 'sepia', name: 'Sepia' }, { id: 'bw', name: 'H&P' },
                  { id: 'lofi', name: 'Lo-Fi' }, { id: 'cyber', name: 'Neon' },
                  { id: 'warm', name: 'Hangat' }, { id: 'cool', name: 'Dingin' },
                  { id: 'dramatic', name: 'Dramatis' }, { id: 'invert', name: 'Invert' }
                ].map((f) => (
                  <button key={f.id} onClick={() => setSelectedFilter(f.id)} className={`py-2 px-1 rounded-lg text-[9px] sm:text-[10px] font-bold border-2 ${selectedFilter === f.id ? 'bg-[#656d4a] text-white border-[#414833]' : 'bg-white border-[#d5bdaf] text-stone-700'}`}>
                    {f.name}
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'layout' && (
              <div className="w-full grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {[
                  { id: 1, name: '1 Pose', icon: '1️⃣' }, { id: 2, name: '2 Poses', icon: '2️⃣' },
                  { id: 3, name: '3 Poses', icon: '3️⃣' }, { id: 4, name: '4 Poses', icon: '4️⃣' },
                  { id: 5, name: '5 Poses', icon: '5️⃣' }, { id: 6, name: '6 Poses', icon: '6️⃣' }
                ].map((ly) => (
                  <button key={ly.id} onClick={() => handleLayoutChange(ly.id)} className={`py-1.5 px-1 rounded-lg text-[10px] font-bold border-2 flex flex-col items-center justify-center gap-1 ${selectedLayout === ly.id ? 'bg-[#656d4a] text-white border-[#414833]' : 'bg-white border-[#d5bdaf] text-stone-700'}`}>
                    <span className="text-[12px]">{ly.icon}</span>
                    <span>{ly.name}</span>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'sticker' && (
              <div className="w-full flex flex-col">
                <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-1.5 p-1 border border-stone-300 rounded bg-stone-100 shadow-inner h-auto">
                  {ALL_STICKERS.map((emoji, idx) => (
                    <button key={idx} onClick={() => handleAddSticker(emoji)} className="hover:scale-125 transition-transform active:scale-95 bg-white border border-[#d5bdaf] rounded md:text-lg flex justify-center items-center py-0.5">
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'text' && (
              <div className="w-full flex flex-col gap-2 items-center justify-center h-full pt-4">
                <span className="text-[9px] text-stone-500 font-bold">Ubah teks di bagian atas kertas foto Anda!</span>
                <input 
                  type="text" 
                  maxLength={22}
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Ketik teks di sini..."
                  className="w-full text-center py-2 px-3 bg-white border-2 border-[#d5bdaf] rounded-lg text-xs font-bold text-stone-800 outline-none focus:border-[#656d4a]"
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          {/* FITUR BARU: Tombol pembatalan mode retake/edit slot */}
          {selectedSlot !== null && (
            <button 
              onClick={() => setSelectedSlot(null)}
              className="bg-stone-500 hover:bg-stone-600 text-white text-[10px] font-black px-3 rounded-xl transition-all uppercase shadow-md border-b-4 border-stone-700 active:border-b-0"
            >
              Batal Edit
            </button>
          )}
          <button onClick={takeSnap} className="flex-1 bg-gradient-to-b from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white font-black py-3 px-4 rounded-xl border-b-4 border-red-900 active:border-b-0 active:mt-1 transition-all shadow-md tracking-wider text-xs uppercase">
            {selectedSlot !== null ? `🔄 AMBIL ULANG FOTO SLOT ${selectedSlot + 1} (3s) 📸` : `📸 AMBIL FOTO (TIMER 3s) [${capturedPhotos.length}/${selectedLayout}] 📸`}
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center z-20 max-h-full mt-10 lg:mt-6 pb-6 w-full lg:w-auto">
        <span className="text-[10px] font-black text-amber-200/80 mb-1 tracking-widest uppercase bg-black/40 px-3 py-1 rounded-full">
          Hasil Strip Cetak
        </span>
        
        <div className="max-h-[75vh] w-full lg:w-auto overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-4 px-6 flex justify-center">
          
          <div ref={stripRef} className={`p-2.5 shadow-[5px_15px_30px_rgba(0,0,0,0.6)] flex flex-col gap-1.5 items-center transform rotate-1 hover:rotate-0 transition-all duration-300 relative border-2 ${getThemeClass()} ${selectedPaperShape} ${selectedLayout > 4 ? 'w-64' : 'w-44'}`}>
            
            {/* LOGIKA BARU: Lubang Roll Film Guntingan Sisi Kiri & Kanan (Hanya aktif di tema cinema) */}
            {selectedFrame === 'theme-cinema' && (
              <>
                {/* Lubang Sisi Kiri */}
                <div 
                    className="absolute left-1.5 top-4 bottom-4 w-3 z-20 pointer-events-none opacity-90"
                    style={{
                    backgroundImage: 'linear-gradient(to bottom, #1c1917 0px, #1c1917 6px, transparent 6px, transparent 12px)',
                    backgroundSize: '100% 12px'
                }}
            />
                {/* Lubang Sisi Kanan */}
                <div 
                className="absolute right-1.5 top-4 bottom-4 w-3 z-20 pointer-events-none opacity-90"
                style={{
                backgroundImage: 'linear-gradient(to bottom, #1c1917 0px, #1c1917 6px, transparent 6px, transparent 12px)',
                backgroundSize: '100% 12px'
                }}
            />
              </>
            )}

            <div className={`text-center font-black tracking-widest text-[9px] uppercase border-b pb-0.5 w-full z-10 relative overflow-hidden whitespace-nowrap text-ellipsis pt-2 rounded backdrop-blur-sm px-1 mt-1 ${selectedFrame === 'theme-cinema' ? 'border-amber-500/20 bg-stone-900/60 text-amber-400' : 'border-current/10 bg-white/20'}`}>
              {customText || "MOMENT STRIP"}
            </div>

            <div className={`w-full z-10 relative ${selectedLayout > 4 ? 'grid grid-cols-2 gap-1.5' : 'flex flex-col gap-1.5'}`}>
              {Array.from({ length: selectedLayout }).map((_, index) => (
                <div 
                  key={index} 
                  className={`w-full aspect-[4/3] bg-stone-300/80 border flex items-center justify-center overflow-hidden relative shadow-inner shrink-0 rounded-sm group transition-all ${
                    selectedSlot === index ? 'ring-4 ring-amber-500 border-amber-500 scale-95 z-30' : (selectedFrame === 'theme-cinema' ? 'border-amber-600/30' : 'border-current/20')
                  }`}
                >
                  {capturedPhotos[index] ? (
                    <>
                      <img 
                        src={capturedPhotos[index].image} 
                        alt={`Pose ${index + 1}`} 
                        className="w-full h-full object-cover" 
                      />
                      
                      {/* Menu Kontrol Interaktif (Retake & Tukar Posisi Letak Foto) saat Mouse Hover */}
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-all duration-200 z-20">
                        <button 
                          onClick={() => setSelectedSlot(index)} 
                          className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-[8px] px-1.5 py-0.5 rounded uppercase"
                          title="Ambil ulang foto ini jika salah"
                        >
                          Retake
                        </button>
                        <button 
                          onClick={() => movePhoto(index, -1)} 
                          disabled={index === 0}
                          className="bg-white hover:bg-stone-200 text-stone-900 font-bold text-[9px] w-5 h-5 rounded flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none"
                          title="Pindahkan ke atas"
                        >
                          ▲
                        </button>
                        <button 
                          onClick={() => movePhoto(index, 1)} 
                          disabled={index === capturedPhotos.length - 1}
                          className="bg-white hover:bg-stone-200 text-stone-900 font-bold text-[9px] w-5 h-5 rounded flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none"
                          title="Pindahkan ke bawah"
                        >
                          ▼
                        </button>
                      </div>
                    </>
                  ) : (
                    <button 
                      onClick={() => setSelectedSlot(index)}
                      className={`absolute inset-0 flex flex-col items-center justify-center text-[7px] font-bold tracking-widest transition-colors ${selectedFrame === 'theme-cinema' ? 'text-amber-200/40 bg-stone-900/50 hover:text-amber-300' : 'text-stone-500 bg-stone-200/50 hover:text-stone-800'}`}
                    >
                      <span>KOSONG</span>
                      <span className="text-[6px] opacity-70 mt-0.5">(KLIK UTK EDIT)</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className={`text-center text-[7px] font-bold opacity-70 mt-auto pt-0.5 w-full border-t z-10 relative pb-1 mb-1 rounded backdrop-blur-sm ${selectedFrame === 'theme-cinema' ? 'border-amber-500/20 bg-stone-900/60' : 'border-current/20 bg-white/20'}`}>
              {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>

            {stickers.map((sticker) => (
              <div
                key={sticker.id}
                onClick={() => handleRemoveSticker(sticker.id)}
                className="absolute text-xl md:text-2xl cursor-pointer hover:scale-125 transition-transform z-20 drop-shadow-md select-none"
                style={{ 
                  left: `${sticker.x}%`, 
                  top: `${sticker.y}%`,
                  transform: `rotate(${sticker.rotation}deg)` 
                }}
                title="Klik untuk menghapus"
              >
                {sticker.emoji}
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleDownload} className="mt-4 w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-black py-2 px-4 rounded-xl border-b-4 border-amber-800 active:border-b-0 active:mt-[18px] transition-all text-[11px] tracking-wider uppercase shadow-md shrink-0">
          💾 UNDUH FOTO
        </button>
      </div>

    </div>
  );
}