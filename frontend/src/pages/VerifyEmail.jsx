import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MailCheck, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('Verifying your email address...');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing verification token.');
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await api.post('/users/verify-email', { token });
        if (response.data.success) {
          setStatus('success');
          setMessage(response.data.message || 'Email verified successfully. You can now log in.');
        }
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed. The token may be expired.');
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none"></div>
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl mb-4 border border-blue-400/20">
            <MailCheck className="text-white" size={36} />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Email Verification</h2>
        </div>

        <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/40 text-center">
          {status === 'loading' && (
            <div className="space-y-6">
              <Loader2 className="animate-spin mx-auto text-blue-500" size={48} />
              <p className="text-slate-300 font-medium">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-6">
              <div className="mx-auto w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="text-emerald-400" size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Verified Successfully</h3>
                <p className="text-slate-300 text-sm">{message}</p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 focus:outline-none transition-all duration-300 shadow-lg"
              >
                Go to Login
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-6">
              <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/30">
                <AlertCircle className="text-red-400" size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Verification Failed</h3>
                <p className="text-slate-300 text-sm">{message}</p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-2xl text-sm font-bold text-white bg-slate-700 hover:bg-slate-600 focus:outline-none transition-all duration-300 shadow-lg"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
