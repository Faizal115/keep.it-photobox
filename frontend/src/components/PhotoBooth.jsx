import React, { useRef, useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import html2canvas from 'html2canvas';

export default function PhotoBooth() {
  const videoRef = useRef(null);
  const stripRef = useRef(null);
  const [stream, setStream] = useState(null);
  
  const [isFlash, setIsFlash] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  
  // STATE AI & FILTER LOVE
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [filterStyle, setFilterStyle] = useState({ display: 'none' });
  const [isLoveFilterActive, setIsLoveFilterActive] = useState(false);

  // STATE MANAJEMEN KONTROL FOTO & TIMER
  const [countdown, setCountdown] = useState(0);
  const [isCounting, setIsCounting] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  const [activeTab, setActiveTab] = useState('effect'); 
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

  // 1. MEMULAI KAMERA
  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 1280, height: 720 } 
        });
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

  // 2. LOAD AI MODELS
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        console.log("AI Models loaded successfully!");
      } catch (err) {
        console.error("Gagal memuat model Face API:", err);
      }
    };
    loadModels();
  }, []);

  // 3. EFEK TRACKING DETEKSI WAJAH
  useEffect(() => {
    let intervalId = null;

    const trackFace = async () => {
      if (!videoRef.current || !isLoveFilterActive || !modelsLoaded) {
        setFilterStyle({ display: 'none' });
        return;
      }

      if (videoRef.current.readyState === 4) {
        try {
          const detections = await faceapi.detectAllFaces(
            videoRef.current, 
            new faceapi.TinyFaceDetectorOptions()
          ).withFaceLandmarks();

          if (detections.length === 0) {
            setFilterStyle({ display: 'none' });
            return;
          }

          const displaySize = {
            width: videoRef.current.clientWidth,
            height: videoRef.current.clientHeight
          };
          
          const resizedDetections = faceapi.resizeResults(detections, displaySize);
          const box = resizedDetections[0].detection.box;

          const width = box.width * 1.4; 
          const height = width * 0.5; 
          const originalX = box.x - (width - box.width) / 2;
          const y = box.y - height - (box.height * 0.1); 

          const mirroredX = displaySize.width - originalX - width;

          setFilterStyle({
            display: 'block',
            position: 'absolute',
            left: `${mirroredX}px`,
            top: `${y}px`,
            width: `${width}px`,
            height: `${height}px`,
            zIndex: 30,
            pointerEvents: 'none'
          });
        } catch (error) {
          console.error("Error saat tracking wajah:", error);
        }
      }
    };

    if (isLoveFilterActive && modelsLoaded) {
      intervalId = setInterval(trackFace, 100);
    } else {
      setFilterStyle({ display: 'none' });
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLoveFilterActive, modelsLoaded]);

  // EFEK PENGHITUNG WAKTU
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && isCounting) {
      executeSnap();
      setIsCounting(false);
    }
  }, [countdown, isCounting]);

  const takeSnap = () => {
    if (isCounting) return;
    setCountdown(3); 
    setIsCounting(true);
  };

  // Merekam Foto Instan
  const executeSnap = () => {
    if (!videoRef.current || videoRef.current.videoWidth === 0 || !stream) return;

    const videoW = videoRef.current.videoWidth;
    const videoH = videoRef.current.videoHeight;

    const canvas = document.createElement('canvas');
    canvas.width = videoW;
    canvas.height = videoH;
    const ctx = canvas.getContext('2d');

    // Tentukan filter warna
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

    // Gambar frame kamera dengan filter (dan efek cermin)
    ctx.filter = canvasFilter;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.filter = 'none';

    // Tempel Love Head jika aktif
    if (isLoveFilterActive && filterStyle.display === 'block') {
      const loveImg = new Image();
      loveImg.src = '/assets/love-head.png';
      
      const scaleX = videoW / videoRef.current.clientWidth;
      const scaleY = videoH / videoRef.current.clientHeight;

      const drawX = parseFloat(filterStyle.left) * scaleX;
      const drawY = parseFloat(filterStyle.top) * scaleY;
      const drawW = parseFloat(filterStyle.width) * scaleX;
      const drawH = parseFloat(filterStyle.height) * scaleY;

      ctx.drawImage(loveImg, drawX, drawY, drawW, drawH);
    }

    // Ambil hasil gambar
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    
    setIsFlash(true);
    setTimeout(() => setIsFlash(false), 150);

    const newPhoto = { image: photoDataUrl };

    if (selectedSlot !== null) {
      const updatedPhotos = [...capturedPhotos];
      updatedPhotos[selectedSlot] = newPhoto;
      setCapturedPhotos(updatedPhotos);
      setSelectedSlot(null); 
    } else {
      if (capturedPhotos.length < selectedLayout) {
        setCapturedPhotos([...capturedPhotos, newPhoto]); 
      } else {
        setCapturedPhotos([newPhoto]);
      }
    }
  };

  const movePhoto = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= capturedPhotos.length) return;
    
    const updatedPhotos = [...capturedPhotos];
    const temp = updatedPhotos[index];
    updatedPhotos[index] = updatedPhotos[targetIndex];
    updatedPhotos[targetIndex] = temp;
    setCapturedPhotos(updatedPhotos);
  };

  // Unduh Foto Statis Strip
  const handleDownload = async () => {
    if (!stripRef.current || capturedPhotos.length === 0) return;
    
    const originalClasses = stripRef.current.className;
    stripRef.current.classList.remove('rotate-1', 'hover:rotate-0');

    try {
      const canvas = await html2canvas(stripRef.current, {
        scale: 3, 
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: null
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
      case 0: x = Math.floor(Math.random() * 80) + 10; y = Math.floor(Math.random() * 5) + 10; break;
      case 1: x = Math.floor(Math.random() * 80) + 10; y = Math.floor(Math.random() * 5) + 83; break;
      case 2: x = Math.floor(Math.random() * 6) + 1; y = Math.floor(Math.random() * 73) + 10; break;
      case 3: x = Math.floor(Math.random() * 6) + 84; y = Math.floor(Math.random() * 73) + 10; break;
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
    <div className="min-h-screen bg-[#3e2723] bg-gradient-to-b from-[#4e342e] to-[#2d1b18] flex flex-col lg:flex-row items-center justify-center p-4 lg:p-6 gap-6 font-mono relative select-none overflow-x-hidden pb-12 pt-20">
      
      {isFlash && (
        <div className="fixed inset-0 bg-white z-[9999] opacity-80 pointer-events-none transition-opacity duration-150"></div>
      )}

      {/* 🔴 TIANG MERAH KIRI & KANAN (PILLARS) */}
      <div className="fixed top-0 bottom-0 left-0 w-6 md:w-12 bg-gradient-to-r from-[#7f1d1d] to-[#991b1b] border-r-4 border-[#450a0a] shadow-[10px_0_25px_rgba(0,0,0,0.8)] z-30"></div>
      <div className="fixed top-0 bottom-0 right-0 w-6 md:w-12 bg-gradient-to-l from-[#7f1d1d] to-[#991b1b] border-l-4 border-[#450a0a] shadow-[-10px_0_25px_rgba(0,0,0,0.8)] z-30"></div>

      {/* 🖼️ BACKGROUND TEXTURE & ICONS */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-15 bg-[repeating-linear-gradient(45deg,#000_0,#000_2px,transparent_2px,transparent_15px)]"></div>
        <div className="absolute inset-0 text-[#e3d5ca] opacity-40 drop-shadow-sm">
            <svg className="absolute top-[12%] left-[13%] w-10 h-10 -rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            <svg className="absolute top-[32%] left-[15%] w-11 h-11 rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            <svg className="absolute top-[52%] left-[12%] w-10 h-10 -rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            <svg className="absolute top-[70%] left-[14%] w-10 h-10 rotate-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <svg className="absolute top-[88%] left-[13%] w-12 h-12 -rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>

            <svg className="absolute top-[10%] right-[14%] w-11 h-11 rotate-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            <svg className="absolute top-[28%] right-[12%] w-10 h-10 -rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <svg className="absolute top-[48%] right-[15%] w-10 h-10 rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            <svg className="absolute top-[68%] right-[13%] w-10 h-10 -rotate-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            <svg className="absolute top-[86%] right-[14%] w-12 h-12 rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        </div>
      </div>
      
      {/* 🎪 TENDA MARQUEE + BARISAN LAMPU KUNING KERLIP */}
      <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-red-800 via-red-900 to-[#3e0c0c] border-b-[6px] border-amber-600/50 shadow-[0_20px_40px_rgba(0,0,0,0.8)] z-40 rounded-b-[40px] flex items-end justify-between px-10 pb-1.5">
        {Array.from({ length: 24 }).map((_, i) => (
          <div 
            key={i} 
            className={`w-2 h-2 rounded-full bg-yellow-300 shadow-[0_0_10px_#fde047,0_0_4px_#ca8a04] ${
              i % 2 === 0 ? 'animate-pulse' : 'animate-[pulse_1s_infinite_500ms]'
            }`}
          ></div>
        ))}
      </div>
      
      {/* 🎫 PAPAN TEKS UTAMA (KEEP.IT STUDIO) */}
      <div className="absolute top-6 inset-x-0 flex justify-center z-50 pointer-events-none">
        <div className="bg-amber-100 px-8 py-2 rounded-full border-4 border-amber-600 shadow-[0_5px_20px_rgba(217,119,6,0.6)] flex items-center gap-4">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
          <h2 className="text-amber-900 font-black tracking-widest text-sm lg:text-base uppercase">📷 Keep.it Studio 📷</h2>
          <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
        </div>
      </div>

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

        {/* BOX CONTAINER KAMERA LIVE */}
        <div className="relative aspect-[4/3] w-full max-h-[40vh] mx-auto overflow-hidden bg-neutral-900 border-4 border-[#e3d5ca] shadow-[inset_0_4px_10px_rgba(0,0,0,0.8)] rounded-xl">
          {countdown > 0 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30 select-none pointer-events-none">
              <span className="text-7xl font-black text-amber-400 animate-bounce tracking-tighter">{countdown}</span>
            </div>
          )}
          
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className={`w-full h-full object-cover relative z-10 transition-all duration-200 scale-x-[-1] ${getFilterClass(selectedFilter)}`} 
          ></video>

          {isLoveFilterActive && (
             <img 
               src="/assets/love-head.png" 
               alt="Filter Love Head"
               style={filterStyle} 
             />
          )}
        </div>

        <div className="mt-3 bg-[#edede9] p-2 rounded-xl border-2 border-[#d5bdaf] flex flex-col gap-2">
          
          <div className="flex flex-wrap gap-1 border-b-2 border-[#d5bdaf] pb-2 justify-center">
            {[
              { id: 'effect', label: '🪄 Efek' }, 
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

          <div className="max-h-[140px] overflow-y-auto overflow-x-hidden flex items-start justify-center p-1">
            
            {activeTab === 'effect' && (
              <div className="w-full flex items-center justify-center h-full pt-2">
                <div className="grid grid-cols-2 gap-2 w-3/4">
                  <button
                    onClick={() => setIsLoveFilterActive(false)}
                    className={`py-3 px-2 rounded-lg text-xs font-bold border-2 transition-all ${
                      !isLoveFilterActive ? 'bg-[#656d4a] text-white border-[#414833] shadow-inner' : 'bg-white border-[#d5bdaf] text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    🚫 Tanpa Efek
                  </button>
                  <button
                    onClick={() => setIsLoveFilterActive(true)}
                    className={`py-3 px-2 rounded-lg text-xs font-bold border-2 transition-all flex items-center justify-center gap-1 ${
                      isLoveFilterActive ? 'bg-pink-500 text-white border-pink-700 shadow-inner' : 'bg-white border-[#d5bdaf] text-pink-600 hover:bg-pink-50'
                    }`}
                  >
                    <span>💖</span> Love Head {!modelsLoaded && '(Loading AI...)'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'frame' && (
              <div className="w-full grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {[
                  { id: 'theme-polos', name: 'Putih Polos' }, { id: 'theme-grid', name: 'Jurnal Grid' }, 
                  { id: 'theme-polka', name: 'Polkadot' }, { id: 'theme-y2k', name: 'Y2K Aura' }, 
                  { id: 'theme-vintage', name: 'Kertas Usang' }, { id: 'theme-blueprint', name: 'Blue Print' },
                  { id: 'theme-neon', name: 'Neon Dark' }, { id: 'theme-notebook', name: 'Buku Tulis' }, 
                  { id: 'theme-holo', name: 'Hologram' }, { id: 'theme-floral', name: 'Floral' },
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
                  { id: 'rounded-none', name: 'Klasik Kotak' }, { id: 'rounded-2xl', name: 'Sudut Lembut' },
                  { id: 'rounded-[45px]', name: 'Kapsul Modern' }, { id: 'rounded-[40px] rounded-br-none', name: 'Chat Bubble' },
                  { id: 'rounded-tr-[40px] rounded-bl-[40px] rounded-tl-sm rounded-br-sm', name: 'Tiket Retro' },
                  { id: 'rounded-t-[50px] rounded-b-md', name: 'Kubah' }, { id: 'rounded-tl-[50px] rounded-br-[50px] rounded-tr-md rounded-bl-md', name: 'Bentuk Daun' },
                  { id: 'rounded-b-[50px] rounded-t-md', name: 'Pita Bawah' }
                ].map((sh) => (
                  <button key={sh.id} onClick={() => setSelectedPaperShape(sh.id)} className={`py-2 px-1 rounded-lg text-[9px] sm:text-[10px] font-bold border-2 ${selectedPaperShape === sh.id ? 'bg-[#656d4a] text-white border-[#414833]' : 'bg-white border-[#d5bdaf] text-stone-700'}`}>
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
          {selectedSlot !== null && (
            <button onClick={() => setSelectedSlot(null)} className="bg-stone-500 hover:bg-stone-600 text-white text-[10px] font-black px-3 rounded-xl border-b-4 border-stone-700 active:border-b-0">
              Batal Edit
            </button>
          )}
          <button onClick={takeSnap} className="flex-1 bg-gradient-to-b from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white font-black py-3 px-4 rounded-xl border-b-4 border-red-900 active:border-b-0 active:mt-1 transition-all shadow-md tracking-wider text-xs uppercase">
            {selectedSlot !== null ? `🔄 AMBIL ULANG SLOT ${selectedSlot + 1} 📸` : `📸 AMBIL FOTO (TIMER 3s) [${capturedPhotos.length}/${selectedLayout}] 📸`}
          </button>
        </div>
      </div>

      {/* STRIP HASIL CETAK */}
      <div className="flex flex-col items-center z-20 max-h-full mt-10 lg:mt-6 pb-6 w-full lg:w-auto">
        <div className="max-h-[75vh] w-full lg:w-auto overflow-y-auto py-4 px-6 flex justify-center">
          <div ref={stripRef} className={`p-2.5 shadow-[5px_15px_30px_rgba(0,0,0,0.6)] flex flex-col gap-1.5 items-center transform rotate-1 hover:rotate-0 transition-all duration-300 relative border-2 ${getThemeClass()} ${selectedPaperShape} ${selectedLayout > 4 ? 'w-64' : 'w-44'}`}>
            
            {selectedFrame === 'theme-cinema' && (
              <>
                <div className="absolute left-1.5 top-4 bottom-4 w-3 z-20 opacity-90" style={{ backgroundImage: 'linear-gradient(to bottom, #1c1917 0px, #1c1917 6px, transparent 6px, transparent 12px)', backgroundSize: '100% 12px' }} />
                <div className="absolute right-1.5 top-4 bottom-4 w-3 z-20 opacity-90" style={{ backgroundImage: 'linear-gradient(to bottom, #1c1917 0px, #1c1917 6px, transparent 6px, transparent 12px)', backgroundSize: '100% 12px' }} />
              </>
            )}

            <div className={`text-center text-[7px] font-bold opacity-70 mt-auto pt-0.5 w-full border-t z-10 pb-1 mb-1 rounded ${selectedFrame === 'theme-cinema' ? 'border-amber-500/20 bg-stone-900/80' : 'border-current/20 bg-white/50'}`}>
              {customText || "MOMENT STRIP"}
            </div>

            <div className={`w-full z-10 relative ${selectedLayout > 4 ? 'grid grid-cols-2 gap-1.5' : 'flex flex-col gap-1.5'}`}>
              {Array.from({ length: selectedLayout }).map((_, index) => (
                <div key={index} className={`photo-slot w-full aspect-[4/3] bg-stone-300/80 border flex items-center justify-center overflow-hidden relative shadow-inner rounded-sm group transition-all ${selectedSlot === index ? 'ring-4 ring-amber-500 border-amber-500 scale-95 z-30' : (selectedFrame === 'theme-cinema' ? 'border-amber-600/30' : 'border-current/20')}`}>
                  {capturedPhotos[index] ? (
                    
                    <div className="w-full h-full relative group/photo overflow-hidden">
                      <img src={capturedPhotos[index].image} alt={`Pose ${index + 1}`} className="w-full h-full object-cover absolute inset-0 z-10" />
                      
                      {/* UI TOMBOL RETAKE / GESER */}
                      <div data-html2canvas-ignore="true" className="absolute inset-0 bg-black/70 opacity-0 group-hover/photo:opacity-100 flex items-center justify-center gap-1 transition-all duration-200 z-30">
                        <button onClick={() => setSelectedSlot(index)} className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-[8px] px-1.5 py-0.5 rounded uppercase">Retake</button>
                        <button onClick={() => movePhoto(index, -1)} disabled={index === 0} className="bg-white hover:bg-stone-200 text-stone-900 font-bold text-[9px] w-5 h-5 rounded flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none">▲</button>
                        <button onClick={() => movePhoto(index, 1)} disabled={index === capturedPhotos.length - 1} className="bg-white hover:bg-stone-200 text-stone-900 font-bold text-[9px] w-5 h-5 rounded flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none">▼</button>
                      </div>
                    </div>

                  ) : (
                    <button onClick={() => setSelectedSlot(index)} className={`absolute inset-0 flex flex-col items-center justify-center text-[7px] font-bold tracking-widest transition-colors ${selectedFrame === 'theme-cinema' ? 'text-amber-200/40 bg-stone-900/50 hover:text-amber-300' : 'text-stone-500 bg-stone-200/50 hover:text-stone-800'}`}>
                      <span>KOSONG</span>
                      <span className="text-[6px] opacity-70 mt-0.5">(KLIK UTK EDIT)</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className={`text-center text-[7px] font-bold opacity-70 mt-auto pt-0.5 w-full border-t z-10 pb-1 mb-1 rounded backdrop-blur-sm ${selectedFrame === 'theme-cinema' ? 'border-amber-500/20 bg-stone-900/60' : 'border-current/20 bg-white/20'}`}>
              {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>

            {stickers.map((sticker) => (
              <div key={sticker.id} onClick={() => handleRemoveSticker(sticker.id)} className="absolute text-xl md:text-2xl cursor-pointer hover:scale-125 transition-transform z-20 drop-shadow-md select-none" style={{ left: `${sticker.x}%`, top: `${sticker.y}%`, transform: `rotate(${sticker.rotation}deg)` }}>
                {sticker.emoji}
              </div>
            ))}
          </div>
        </div>

        {/* TOMBOL UNDUH */}
        <div className="mt-4 w-full px-2">
          <button 
            onClick={handleDownload} 
            disabled={capturedPhotos.length === 0}
            className={`w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-black py-3 px-4 rounded-xl border-b-4 border-amber-800 active:border-b-0 active:translate-y-1 transition-all text-xs tracking-widest uppercase shadow-md flex items-center justify-center gap-2 ${capturedPhotos.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span>💾</span> SIMPAN FOTO STRIP
          </button>
        </div>
        
      </div>

    </div>
  );
}