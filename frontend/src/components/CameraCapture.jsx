import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Camera, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import Button from './Button';

const CameraCapture = forwardRef(({ 
  onCapture, 
  facingMode = 'user', 
  showGuide = true, 
  livenessHUD = null,
  actionButtonLabel = 'Capture Face',
  disabled = false,
  autoCapture = false,
  onStreamActive
}, ref) => {
  const [error, setError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stream, setStream] = useState(null);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useImperativeHandle(ref, () => ({
    capture: () => {
      handleCapture();
    }
  }));

  const startCamera = async () => {
    try {
      setError('');
      setLoading(true);
      if (streamRef.current) {
        stopCamera();
      }
      
      const constraints = {
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 }, 
          facingMode: facingMode 
        }
      };

      // Check secure context for camera access
      if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        setError('Camera access requires a secure context (HTTPS) or localhost. Please enable Chrome override flags (chrome://flags/#unsafely-treat-insecure-origin-as-secure) or configure HTTPS.');
        setLoading(false);
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Browser does not support camera access or restricts camera in insecure contexts.');
        setLoading(false);
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setCameraActive(true);
      if (onStreamActive) onStreamActive();
    } catch (err) {
      console.error('Camera access error:', err);
      // Map standard browser errors to friendly user-facing messages
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission denied. Please enable camera access in browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera detected. Please connect a webcam.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Camera already in use. Please close other applications using the webcam.');
      } else {
        setError(`Biometric camera access failed: ${err.message || err.name}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
    setCameraActive(false);
  };

  const handleCapture = () => {
    if (!videoRef.current || !cameraActive) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      
      // Mirror canvas for front face selfie capture
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL('image/jpeg', 0.9);
      
      if (onCapture) {
        onCapture(base64Image);
      }
    } catch (err) {
      console.error('Frame capture error:', err);
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(playErr => {
        console.warn("Video play failed or interrupted:", playErr);
      });
    }
  }, [stream]);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Video Container */}
      <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-slate-900 border border-slate-700/50 shadow-lg flex items-center justify-center">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10">
            <Loader2 className="animate-spin text-blue-500 mb-2" size={32} />
            <span className="text-xs text-slate-400 font-medium">Opening camera...</span>
          </div>
        )}

        {error ? (
          <div className="p-6 text-center text-rose-400 flex flex-col items-center gap-2.5 z-10">
            <AlertTriangle size={36} />
            <p className="text-sm font-semibold max-w-xs">{error}</p>
            <Button variant="primary" onClick={startCamera} size="sm" className="mt-2">
              <RefreshCw size={14} className="mr-1.5" /> Retry Camera
            </Button>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform -scale-x-100' : ''}`} 
            />
            
            {/* Guided Face Overlay (Oval) */}
            {showGuide && (
              <div className="absolute inset-0 border-[3px] border-dashed border-blue-500/40 rounded-[45%] pointer-events-none w-[60%] h-[75%] top-[12.5%] left-[20%]" />
            )}
            
            {/* Corner Markers */}
            <div className="absolute top-6 left-6 w-8 h-8 border-t-4 border-l-4 border-white/70 rounded-tl-lg" />
            <div className="absolute top-6 right-6 w-8 h-8 border-t-4 border-r-4 border-white/70 rounded-tr-lg" />
            <div className="absolute bottom-6 left-6 w-8 h-8 border-b-4 border-l-4 border-white/70 rounded-bl-lg" />
            <div className="absolute bottom-6 right-6 w-8 h-8 border-b-4 border-r-4 border-white/70 rounded-br-lg" />

            {/* Liveness HUD state overlay slot */}
            {livenessHUD && (
              <div className="absolute bottom-4 left-4 right-4 flex justify-center z-10">
                {livenessHUD}
              </div>
            )}
          </>
        )}
      </div>

      {/* Control Button */}
      {!error && !loading && !autoCapture && (
        <div className="mt-6 flex justify-center">
          <Button 
            variant="success" 
            onClick={handleCapture}
            disabled={!cameraActive || disabled}
            className="px-8 py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 font-bold"
            icon={Camera}
          >
            {actionButtonLabel}
          </Button>
        </div>
      )}
    </div>
  );
});

export default CameraCapture;
