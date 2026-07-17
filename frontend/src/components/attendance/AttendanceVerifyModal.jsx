import { useState, useEffect, useRef } from 'react';
import { Loader2, RefreshCw, AlertTriangle, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import Modal from '../Modal';
import Button from '../Button';
import toast from 'react-hot-toast';
import { verifyFace, verifyQr, checkInWithAI, checkOutWithAI } from '../../services/presenceService';
import CameraCapture from '../CameraCapture';

const AttendanceVerifyModal = ({ isOpen, onClose, type, employeeId, onSuccess }) => {
  const [step, setStep] = useState(0); // 0: Face Auth, 1: Verifying Face, 2: Face Success, 3: QR Scan, 4: QR Verifying, 5: Complete
  
  const [faceConfidence, setFaceConfidence] = useState(0);
  const [faceToken, setFaceToken] = useState('');
  const [qrToken, setQrToken] = useState('');
  const [error, setError] = useState('');
  const [qrError, setQrError] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Looking for face...");
  
  const qrScannerRef = useRef(null);
  const cameraRef = useRef(null);
  const verifyInterval = useRef(null);
  const isRequestPending = useRef(false);
  const qrScanLock = useRef(false);
  const lastScannedToken = useRef('');
  const isInitializingScanner = useRef(false);

  const typeRef = useRef(type);
  const employeeIdRef = useRef(employeeId);
  const faceTokenRef = useRef(faceToken);

  useEffect(() => {
    typeRef.current = type;
  }, [type]);

  useEffect(() => {
    employeeIdRef.current = employeeId;
  }, [employeeId]);

  useEffect(() => {
    faceTokenRef.current = faceToken;
  }, [faceToken]);

  const resetState = () => {
    setStep(0);
    setFaceConfidence(0);
    setFaceToken('');
    setQrToken('');
    setError('');
    setQrError('');
    setQrLoading(false);
    setStatusMessage("Looking for face...");
    isRequestPending.current = false;
    qrScanLock.current = false;
    lastScannedToken.current = '';
    isInitializingScanner.current = false;
    stopQrScanner();
    stopPolling();
  };

  useEffect(() => {
    if (isOpen && step === 0 && !error) {
      startPolling();
    } else {
      stopPolling();
    }
    
    // Auto-start QR scanner when step reaches 3
    if (isOpen && step === 3 && !qrScannerRef.current && !qrError && !isInitializingScanner.current) {
      startQrScanner();
    }

    return () => {
      stopPolling();
      stopQrScanner();
    };
  }, [isOpen, step, error, qrError]);

  const startPolling = () => {
    if (verifyInterval.current) clearInterval(verifyInterval.current);
    verifyInterval.current = setInterval(() => {
      if (cameraRef.current && !isRequestPending.current && step === 0 && !error) {
        cameraRef.current.capture();
      }
    }, 1500);
  };

  const stopPolling = () => {
    if (verifyInterval.current) {
      clearInterval(verifyInterval.current);
      verifyInterval.current = null;
    }
  };

  const handleCapture = async (base64Image) => {
    if (isRequestPending.current || step !== 0) return;
    
    isRequestPending.current = true;
    setStatusMessage("Checking liveness & generating signature...");

    try {
      const result = await verifyFace(employeeIdRef.current, base64Image); 
      
      if (result.success && result.match) {
        stopPolling();
        setFaceConfidence(result.confidence);
        setFaceToken(result.faceToken);
        setStep(2); // Success step
        
        // Auto proceed to QR scan step after 1.5 seconds
        setTimeout(() => {
          setStep(3);
        }, 1500);
      }
    } catch (err) {
      const errReason = err.response?.data?.reason;
      const errMsg = err.response?.data?.message;

      if (errReason === "FACE_NOT_DETECTED") {
        setStatusMessage("Looking for face...");
      } else if (errReason === "MULTIPLE_FACES") {
        setStatusMessage("Only one person allowed in frame.");
      } else if (errReason === "LIVENESS_FAILED") {
        setError("Spoofing detected. Please use a live face.");
        stopPolling();
      } else if (errReason === "FACE_NOT_MATCHED") {
        setError("Face matched a different employee.");
        stopPolling();
      } else {
        if (!errReason || errReason === "LOW_FACE_QUALITY") {
           setStatusMessage(errMsg || "Adjust lighting and face camera directly.");
        } else {
           setError(errMsg || 'Biometric update failed. Please try again.');
           stopPolling();
        }
      }
    } finally {
      isRequestPending.current = false;
    }
  };

  // Start QR Scanner
  const startQrScanner = async () => {
    if (isInitializingScanner.current) return;
    isInitializingScanner.current = true;

    try {
      setQrError('');
      setQrLoading(true);
      
      // Stop existing instance if any
      await stopQrScanner();

      // Ensure DOM is fully ready & mobile camera has time to be released by the OS (500ms)
      setTimeout(async () => {
        try {
          if (!document.getElementById("qr-reader")) {
            throw new Error("QR container not found");
          }

          // Check secure context for camera access
          if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            setQrError('Camera access requires a secure context (HTTPS) or localhost. Please enable Chrome override flags (chrome://flags/#unsafely-treat-insecure-origin-as-secure) or configure HTTPS.');
            setQrLoading(false);
            isInitializingScanner.current = false;
            return;
          }

          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setQrError('Browser does not support camera access or restricts camera in insecure contexts.');
            setQrLoading(false);
            isInitializingScanner.current = false;
            return;
          }

          const qrScanner = new Html5Qrcode("qr-reader");
          qrScannerRef.current = qrScanner;

          await qrScanner.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            async (decodedText) => {
              const cleanToken = decodedText.trim();
              
              // Ensure we only trigger once per valid scan and avoid spamming
              if (qrScanLock.current) return;
              if (cleanToken === lastScannedToken.current && step >= 4) return;

              qrScanLock.current = true;
              lastScannedToken.current = cleanToken;

              // Pause the camera stream visually without turning off the hardware
              if (qrScannerRef.current) {
                try { qrScannerRef.current.pause(true); } catch (e) { console.warn("Could not pause scanner", e); }
              }

              await handleQrScanned(cleanToken);
            },
            (errorMessage) => {
              // ignore scan loops errors
            }
          );
          setQrLoading(false);
          isInitializingScanner.current = false;
        } catch (scannerErr) {
          console.error("🚨 [QR Scanner] QR Code scanner initialization failed:", scannerErr);
          if (scannerErr?.name === 'NotAllowedError' || scannerErr?.name === 'PermissionDeniedError') {
             setQrError('Camera permission denied. Please enable camera access in browser settings.');
          } else if (scannerErr?.name === 'NotFoundError' || scannerErr?.name === 'DevicesNotFoundError') {
             setQrError('No camera detected. Please connect a webcam.');
          } else {
             setQrError("Failed to access camera. It might be in use or unavailable.");
          }
          setQrLoading(false);
          isInitializingScanner.current = false;
        }
      }, 500);
    } catch (err) {
      console.error("🚨 [QR Scanner] Scanner setup failed:", err);
      setQrError("Scanner initialization failed.");
      setQrLoading(false);
      isInitializingScanner.current = false;
    }
  };

  // Step 2: Handle QR Scanned
  const handleQrScanned = async (cleanToken) => {
    setQrToken(cleanToken);
    setStep(4); // "Verifying..." state
    setQrError('');
    setError('');

    try {
      const verifyRes = await verifyQr(cleanToken);
      if (!verifyRes.success || !verifyRes.valid) {
        setError('QR Code is invalid or has expired.');
        setStep(3);
        qrScanLock.current = false;
        if (qrScannerRef.current) {
          try { qrScannerRef.current.resume(); } catch (e) {}
        }
        return;
      }

      const deviceInfo = `Browser: ${navigator.appName} on ${navigator.platform}`;
      const currentType = typeRef.current;
      const currentFaceToken = faceTokenRef.current;

      let finalAttendance;
      if (currentType === 'check-in') {
        finalAttendance = await checkInWithAI(currentFaceToken, cleanToken, deviceInfo);
      } else {
        finalAttendance = await checkOutWithAI(currentFaceToken, cleanToken, deviceInfo);
      }

      // Turn off hardware entirely since we succeeded
      await stopQrScanner();

      toast.success(currentType === 'check-in' ? 'Checked in successfully!' : 'Checked out successfully!');
      setStep(5); // Complete state
      
      if (onSuccess) {
        onSuccess(finalAttendance);
      }
    } catch (err) {
      console.error('🚨 [QR Scanner] Check-in final api error:', err);
      setError(err.response?.data?.message || 'Verification failed. Please scan again.');
      setStep(3); // Return to QR Scan step
      qrScanLock.current = false;
      if (qrScannerRef.current) {
        try { qrScannerRef.current.resume(); } catch (e) {}
      }
    }
  };

  const stopQrScanner = async () => {
    if (qrScannerRef.current) {
      const isScanning = qrScannerRef.current.isScanning;
      if (isScanning) {
        try {
          await qrScannerRef.current.stop();
          qrScannerRef.current.clear();
        } catch (err) {
          console.error("🚨 [QR Scanner] Error stopping QR scanner:", err);
        }
      }
      qrScannerRef.current = null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { resetState(); onClose(); }} title={type === 'check-in' ? 'Secure Check-In Verification' : 'Secure Check-Out Verification'} size="md">
      <div className="space-y-6 flex flex-col items-center">
        
        {/* Step Indicator Headers */}
        <div className="flex items-center justify-between w-full border-b border-slate-100 pb-4 mb-2">
          <span className={`text-sm font-bold flex items-center gap-1.5 ${step <= 2 ? 'text-blue-600' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${step <= 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>1</span>
            Face Verification
          </span>
          <div className="h-0.5 w-12 bg-slate-200" />
          <span className={`text-sm font-bold flex items-center gap-1.5 ${step >= 3 && step <= 4 ? 'text-blue-600' : step === 5 ? 'text-emerald-600' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${step >= 3 && step <= 4 ? 'bg-blue-600 text-white' : step === 5 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>2</span>
            QR Verification
          </span>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-xs text-red-600 flex items-center gap-2 w-full animate-in fade-in duration-200">
            <AlertTriangle size={18} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 0: Local AI Camera Detection */}
        {step === 0 && (
          <div className="w-full flex flex-col items-center text-center space-y-4 max-w-sm">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 w-full mb-2">
              <h4 className="font-bold text-slate-800 text-sm">Face Liveness Detection</h4>
              <p className="text-blue-600 font-semibold text-xs mt-1 animate-pulse">{statusMessage}</p>
            </div>
            
            <CameraCapture 
              ref={cameraRef}
              onCapture={handleCapture}
              autoCapture={true}
              disabled={error !== ''}
            />
            
            {error && (
              <Button variant="secondary" onClick={() => { setError(''); startPolling(); }} className="rounded-xl mt-4 w-full">
                <RefreshCw size={14} className="mr-1.5" /> Try Again
              </Button>
            )}
          </div>
        )}

        {/* Step 2: Face Success Checkmark */}
        {step === 2 && (
          <div className="py-12 flex flex-col items-center text-center space-y-4 animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30 text-emerald-500">
              <CheckCircle2 size={36} strokeWidth={3} />
            </div>
            <h4 className="font-bold text-slate-800 text-lg">Face verified successfully</h4>
            <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100 flex items-center gap-1">
              <Sparkles size={12} /> Confidence: {faceConfidence.toFixed(2)}%
            </span>
            <p className="text-slate-400 text-xs font-semibold pt-4">Preparing QR Reader...</p>
          </div>
        )}

        {/* Step 3: QR Scanner View */}
        {step === 3 && (
          <div className="w-full flex flex-col items-center text-center space-y-6 animate-in fade-in duration-200">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 w-full">
              <h4 className="font-bold text-slate-800 text-sm">Step 2: Scan Dynamic QR Code</h4>
              <p className="text-slate-500 text-xs mt-1">Point your camera at the manager's screen showing the QR code.</p>
            </div>

            {/* QR Scanner Container */}
            <div className="relative w-full max-w-sm aspect-[4/3] rounded-3xl overflow-hidden bg-slate-900 border border-slate-200/50 shadow-lg flex items-center justify-center">
              
              {qrLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10">
                  <Loader2 className="animate-spin text-blue-500 mb-2" size={32} />
                  <span className="text-xs text-slate-400 font-medium">Opening camera...</span>
                </div>
              )}

              {qrError ? (
                <div className="p-6 text-center text-rose-400 flex flex-col items-center gap-2.5 z-10">
                  <AlertTriangle size={36} />
                  <p className="text-sm font-semibold max-w-xs">{qrError}</p>
                  <Button variant="primary" onClick={startQrScanner} size="sm" className="mt-2">
                    <RefreshCw size={14} className="mr-1.5" /> Retry Scanner
                  </Button>
                </div>
              ) : (
                <>
                  <div id="qr-reader" className="w-full h-full object-cover" />
                  {/* Target Scan Zone Outline Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 border-[3.5px] border-dashed border-blue-500/40 rounded-2xl" />
                  </div>
                </>
              )}
            </div>

            <Button variant="secondary" onClick={async () => { await stopQrScanner(); setStep(0); setError(''); setQrError(''); }} className="rounded-xl">
              <RefreshCw size={14} className="mr-1.5" /> Back to Face Verification
            </Button>
          </div>
        )}

        {/* Step 4: Final Verification progress (Spinner) */}
        {step === 4 && (
          <div className="py-12 flex flex-col items-center text-center space-y-4">
            <Loader2 className="animate-spin text-blue-600" size={48} />
            <h4 className="font-bold text-slate-800 text-base">Validating QR Code...</h4>
            <p className="text-slate-500 text-xs max-w-xs">Double-checking token signature, expiration constraints, and logging attendance record.</p>
          </div>
        )}

        {/* Step 5: Completion Success */}
        {step === 5 && (
          <div className="py-12 flex flex-col items-center text-center space-y-4 animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center border border-emerald-400 text-white shadow-lg shadow-emerald-500/20">
              <ShieldCheck size={36} strokeWidth={2.5} />
            </div>
            <h4 className="font-bold text-slate-800 text-lg">Attendance Registered!</h4>
            <p className="text-slate-500 text-xs max-w-xs">Your check-in session has been verified and safely recorded. You may now close this window.</p>
            
            <Button variant="success" onClick={() => { resetState(); onClose(); }} className="rounded-xl w-full max-w-xs mt-6">
              Close Window
            </Button>
          </div>
        )}

      </div>
    </Modal>
  );
};

export default AttendanceVerifyModal;
