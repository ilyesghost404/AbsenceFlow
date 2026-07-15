import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2, KeyRound } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const VerifyResetCode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [resendCooldown, setResendCooldown] = useState(60); // 60 seconds

  const inputRefs = useRef([]);

  // Redirect if email is not present
  useEffect(() => {
    if (!email) {
      toast.error('Session expired. Please request a new code.');
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  // Countdown timer for code expiry (10 minutes)
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Cooldown for resending code (60 seconds)
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (index, value) => {
    // Only allow digits
    if (value !== '' && !/^[0-9]$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace to focus previous input
    if (e.key === 'Backspace' && code[index] === '' && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pastedData)) return;

    const digits = pastedData.split('');
    setCode(digits);
    inputRefs.current[5].focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    const fullCode = code.join('');

    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits of the code.');
      return;
    }

    if (timeLeft <= 0) {
      setError('The verification code has expired. Please request a new code.');
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post('/auth/verify-reset-code', { email, code: fullCode });
      toast.success('Verification successful!');
      navigate('/reset-password', { state: { email } });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setError('');
    setIsResending(true);

    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('A new verification code has been sent!');
      setCode(['', '', '', '', '', '']);
      setTimeLeft(600); // Reset countdown to 10 mins
      setResendCooldown(60); // Reset cooldown to 60s
      inputRefs.current[0].focus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none"></div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl mb-4 border border-blue-400/20">
            <KeyRound className="text-white" size={36} />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Verify Reset Code</h2>
          <p className="mt-2 text-sm text-slate-400 text-center">
            We sent a 6-digit verification code to <span className="font-semibold text-white">{email}</span>
          </p>
        </div>

        <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/40">
          <form className="space-y-6" onSubmit={handleVerify}>
            {error && (
              <div className="bg-red-500/15 border border-red-500/35 rounded-2xl p-4 text-sm text-red-300 flex items-center gap-2 animate-shake">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <label className="block text-center text-sm font-medium text-slate-300">
                Enter the 6-digit OTP code below
              </label>

              {/* 6 Digit Box Inputs */}
              <div className="flex justify-between gap-2" onPaste={handlePaste}>
                {code.map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    maxLength={1}
                    value={digit}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-12 h-14 text-center bg-slate-800/40 border border-slate-700/50 rounded-xl text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                ))}
              </div>

              {/* Countdown Timer */}
              <div className="flex justify-between items-center text-xs text-slate-400 pt-2">
                <span>Code expires in:</span>
                <span className={`font-semibold ${timeLeft <= 60 ? 'text-red-400 font-bold animate-pulse' : 'text-slate-200'}`}>
                  {timeLeft > 0 ? formatTime(timeLeft) : 'Expired'}
                </span>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting || code.some((d) => d === '')}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-blue-600/20 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </button>
            </div>

            {/* Resend Cooldown Option */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || isResending}
                className="text-sm font-semibold text-blue-500 hover:text-blue-400 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {isResending ? (
                  <span className="flex items-center gap-1 justify-center">
                    <Loader2 className="animate-spin" size={14} /> Resending...
                  </span>
                ) : resendCooldown > 0 ? (
                  `Resend code in ${resendCooldown}s`
                ) : (
                  'Resend Code'
                )}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors mx-auto cursor-pointer"
              >
                <ArrowLeft size={16} /> Back to Forgot Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyResetCode;
