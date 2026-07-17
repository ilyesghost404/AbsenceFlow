import { useState, useEffect, useRef } from 'react';
import { Loader2, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import CameraCapture from './CameraCapture';
import Button from './Button';
import toast from 'react-hot-toast';
import api from '../services/api';

const FaceRegistration = ({ employeeId, token, verifyToken, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Looking for face...");
  
  const cameraRef = useRef(null);
  const verifyInterval = useRef(null);
  const isRequestPending = useRef(false);

  useEffect(() => {
    // Start automated capturing loop
    verifyInterval.current = setInterval(() => {
      if (cameraRef.current && !isRequestPending.current && !isSuccess && !isVerifying) {
        cameraRef.current.capture();
      }
    }, 1500);

    return () => {
      if (verifyInterval.current) {
        clearInterval(verifyInterval.current);
      }
    };
  }, [isSuccess, isVerifying]);

  const handleCapture = async (base64Image) => {
    if (isRequestPending.current || isSuccess || isVerifying) return;
    
    isRequestPending.current = true;
    setStatusMessage("Checking liveness...");

    try {
      let res;
      if (verifyToken) {
        res = await api.put('/security/update-face', {
          verifyToken,
          image: base64Image
        });
      } else {
        const payload = {
          employeeId: parseInt(employeeId, 10),
          image: base64Image
        };
        if (token) payload.token = token;
        res = await api.post('/security/register-face', payload);
      }
      
      if (res.data.success) {
        setIsVerifying(true);
        setStatusMessage("Generating face signature...");
        
        setTimeout(() => {
          setIsSuccess(true);
          setIsVerifying(false);
          toast.success(verifyToken ? 'Face profile updated successfully!' : 'Face profile registered successfully!');
          if (onSuccess) {
            setTimeout(() => onSuccess(99), 1500);
          }
        }, 1000); // Simulate processing delay for UI feedback
      }
    } catch (err) {
      console.error('Submit face error:', err);
      const errReason = err.response?.data?.reason;
      const errMsg = err.response?.data?.message;

      if (errReason === "FACE_NOT_DETECTED") {
        setStatusMessage("Looking for face...");
      } else if (errReason === "MULTIPLE_FACES") {
        setStatusMessage("Only one person allowed in frame.");
      } else if (errReason === "LIVENESS_FAILED") {
        setError("Spoofing detected. Please use a live face.");
        clearInterval(verifyInterval.current);
      } else {
        // Only stop polling for hard errors
        if (!errReason || errReason === "LOW_FACE_QUALITY") {
           setStatusMessage(errMsg || "Adjust lighting and face camera directly.");
        } else {
           setError(errMsg || 'Biometric update failed. Please try again.');
           clearInterval(verifyInterval.current);
        }
      }
    } finally {
      isRequestPending.current = false;
    }
  };

  const handleSkip = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/users/activate-account/skip-face', { token });
      if (res.data.success) {
        toast.success('Face ID registration skipped.');
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err) {
      console.error('Skip face ID error:', err);
      const errMsg = err.response?.data?.message || 'Failed to skip Face ID setup.';
      setError(errMsg);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
        <h4 className="font-bold text-slate-800 text-lg">Initializing Security Module</h4>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-center animate-in zoom-in duration-300">
        <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center border border-emerald-400 text-white shadow-lg shadow-emerald-500/20 mb-4">
          <CheckCircle2 size={36} strokeWidth={2.5} />
        </div>
        <h4 className="font-bold text-slate-800 text-lg">Identity verified and registered!</h4>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex flex-col items-center max-w-md">
        <div className="bg-rose-500/10 border border-rose-500/25 rounded-2xl p-6 text-center text-rose-600 mb-6 shadow-sm">
          <AlertTriangle size={36} className="mx-auto mb-3 text-rose-500" />
          <h4 className="font-bold text-rose-800 mb-2">Verification Failed</h4>
          <p className="text-sm">{error}</p>
        </div>
        
        <Button variant="secondary" onClick={() => { setError(null); }} className="rounded-xl w-full">
          <RefreshCw size={16} className="mr-2" /> Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full flex flex-col items-center max-w-md">
        {/* Instruction Card */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 w-full text-center mb-6 shadow-sm">
          <h4 className="font-bold text-slate-800 text-base">Face Authentication</h4>
          <p className="text-blue-600 font-semibold text-sm mt-1 animate-pulse">{statusMessage}</p>
        </div>

        <CameraCapture 
          ref={cameraRef}
          onCapture={handleCapture}
          autoCapture={true}
          disabled={isVerifying || isSuccess}
        />

        {/* Skip Option during activation */}
        {token && (
          <div className="mt-6 w-full max-w-md pt-4 border-t border-slate-100/50 flex justify-center animate-in fade-in slide-in-from-bottom-2 duration-300">
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1 cursor-pointer"
            >
              Skip Face ID Setup
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceRegistration;
