'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, Flashlight, RotateCcw, Search } from 'lucide-react';
import { searchGoogleBooks, searchOpenLibrary } from '@/lib/api';
import type { Book } from '@/types';
import toast from 'react-hot-toast';

interface ISBNScannerProps {
  onBookFound: (book: Book) => void;
  onClose: () => void;
}

// Detect ISBN barcode from video frame using a simple pattern
// In production you'd use @zxing/library or quagga2
async function detectBarcodeFromStream(video: HTMLVideoElement): Promise<string | null> {
  // Use BarcodeDetector API if available (Chrome 83+, Android WebView)
  if ('BarcodeDetector' in window) {
    try {
      const detector = new (window as unknown as { BarcodeDetector: new (opts: object) => { detect: (el: HTMLVideoElement) => Promise<Array<{ rawValue: string; format: string }>> } }).BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'isbn'],
      });
      const barcodes = await detector.detect(video);
      for (const barcode of barcodes) {
        const val = barcode.rawValue;
        // ISBN-13 starts with 978 or 979
        if (/^97[89]\d{10}$/.test(val)) return val;
        // ISBN-10
        if (/^\d{9}[\dX]$/.test(val)) return val;
      }
    } catch (e) {
      console.warn('BarcodeDetector failed:', e);
    }
  }
  return null;
}

export function ISBNScanner({ onBookFound, onClose }: ISBNScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);
  const [detected, setDetected] = useState<string | null>(null);
  const [manualISBN, setManualISBN] = useState('');
  const [loading, setLoading] = useState(false);
  const [torch, setTorch] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scanInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraReady(true);
          setScanning(true);
        };
      }
    } catch (err) {
      setError('Camera access denied. Please use manual entry below.');
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stream?.getTracks().forEach(t => t.stop());
      if (scanInterval.current) clearInterval(scanInterval.current);
    };
  }, []);

  // Scan loop
  useEffect(() => {
    if (!cameraReady || !scanning) return;
    scanInterval.current = setInterval(async () => {
      if (!videoRef.current) return;
      const isbn = await detectBarcodeFromStream(videoRef.current);
      if (isbn && isbn !== detected) {
        setDetected(isbn);
        setScanning(false);
        searchByISBN(isbn);
      }
    }, 500);
    return () => { if (scanInterval.current) clearInterval(scanInterval.current); };
  }, [cameraReady, scanning, detected]);

  const toggleTorch = useCallback(async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    try {
      await track.applyConstraints({ advanced: [{ torch: !torch } as MediaTrackConstraintSet] });
      setTorch(t => !t);
    } catch {
      toast.error('Torch not available');
    }
  }, [stream, torch]);

  const searchByISBN = async (isbn: string) => {
    setLoading(true);
    try {
      const [gbResults, olResults] = await Promise.allSettled([
        searchGoogleBooks(`isbn:${isbn}`, 1),
        searchOpenLibrary(`isbn:${isbn}`, 1),
      ]);
      const gb = gbResults.status === 'fulfilled' ? gbResults.value : [];
      const ol = olResults.status === 'fulfilled' ? olResults.value : [];
      const book = gb[0] || ol[0];
      if (book) {
        toast.success(`Found: "${book.title}"!`);
        onBookFound(book);
      } else {
        toast.error('Book not found for this ISBN');
        setDetected(null);
        setScanning(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = () => {
    const isbn = manualISBN.replace(/[-\s]/g, '');
    if (isbn.length < 10) return toast.error('Enter a valid ISBN');
    searchByISBN(isbn);
  };

  return (
    <div className="fixed inset-0 z-[300] flex flex-col" style={{ background: '#000' }}>
      {/* Camera view */}
      <div className="relative flex-1 overflow-hidden">
        {!error ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {/* Dimmed corners */}
              <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} />

              {/* Scan frame */}
              <div className="relative z-10">
                <div className="w-72 h-48 relative">
                  {/* Corner brackets */}
                  {[
                    'top-0 left-0 border-t-4 border-l-4',
                    'top-0 right-0 border-t-4 border-r-4',
                    'bottom-0 left-0 border-b-4 border-l-4',
                    'bottom-0 right-0 border-b-4 border-r-4',
                  ].map((cls, i) => (
                    <div key={i} className={`absolute w-8 h-8 rounded-sm ${cls}`}
                      style={{ borderColor: scanning ? '#fff' : detected ? '#22c55e' : '#f59e0b' }} />
                  ))}

                  {/* Scan line */}
                  {scanning && !detected && (
                    <div className="absolute left-2 right-2 h-0.5 animate-bounce"
                      style={{
                        background: 'linear-gradient(to right, transparent, #fff, transparent)',
                        animation: 'scanLine 2s ease-in-out infinite',
                        top: '50%',
                      }} />
                  )}

                  {/* Clear center for camera */}
                  <div className="absolute inset-4 rounded" style={{ background: 'transparent' }} />
                </div>

                <p className="text-white text-center text-sm mt-4 font-medium">
                  {loading ? 'Searching...' : detected ? '✅ ISBN detected!' : 'Point at a book barcode'}
                </p>
                {detected && !loading && (
                  <p className="text-white/70 text-center text-xs mt-1">ISBN: {detected}</p>
                )}
              </div>
            </div>

            {/* Controls overlay */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-20">
              <button onClick={onClose}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
                <X size={18} className="text-white" />
              </button>
              <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
                className="px-4 py-2 rounded-full">
                <p className="text-white text-sm font-semibold">📸 ISBN Scanner</p>
              </div>
              <button onClick={toggleTorch}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: torch ? 'rgba(245,158,11,0.8)' : 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(8px)',
                }}>
                <span className="text-white text-lg">🔦</span>
              </button>
            </div>

            {/* Retry */}
            {!scanning && !loading && (
              <div className="absolute bottom-32 left-0 right-0 flex justify-center z-20">
                <button onClick={() => { setDetected(null); setScanning(true); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-medium"
                  style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
                  <RotateCcw size={14} /> Scan again
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full px-8">
            <div className="text-center space-y-3">
              <Camera size={48} className="mx-auto text-white/50" />
              <p className="text-white font-semibold">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Manual entry panel */}
      <div className="p-4 space-y-3" style={{ background: 'var(--bg-card)' }}>
        <p className="text-xs font-semibold text-center" style={{ color: 'var(--text-muted)' }}>
          Or enter ISBN manually
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            className="input-base flex-1"
            placeholder="978-3-16-148410-0"
            value={manualISBN}
            onChange={e => setManualISBN(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleManualSearch()}
          />
          <button onClick={handleManualSearch} disabled={loading}
            className="btn-primary px-4 flex items-center gap-2">
            {loading ? '...' : <><Search size={14} /> Find</>}
          </button>
        </div>
        <button onClick={onClose} className="btn-secondary w-full text-sm py-2">
          Cancel
        </button>
      </div>

      <style jsx>{`
        @keyframes scanLine {
          0%, 100% { top: 20%; }
          50% { top: 80%; }
        }
      `}</style>
    </div>
  );
}
