import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import PasswordInput from '../components/PasswordInput';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Redirect if email is not present
  useEffect(() => {
    if (!email) {
      toast.error('Session expired. Please request a new code.');
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  const isStrong = newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) && /[0-9]/.test(newPassword) && /[!@#$%^&*()[\]{}\\|;:'",.<>/?~_+-=]/.test(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Invalid or missing email.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!isStrong) {
      setError('Please choose a stronger password that meets all requirements');
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post('/auth/reset-password', { email, newPassword });
      toast.success('Password reset successfully!');
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!email && !success) {
    return null;
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none"></div>
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl mb-4 border border-blue-400/20">
            <ShieldCheck className="text-white" size={36} />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Create New Password</h2>
          <p className="mt-2 text-sm text-slate-400 text-center">
            Your new password must be different from previous used passwords.
          </p>
        </div>

        <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/40">
          {success ? (
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="text-emerald-400" size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Password Reset Successfully</h3>
                <p className="text-slate-300 text-sm">
                  You can now log in with your new password. All your previous sessions have been securely logged out.
                </p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 focus:outline-none transition-all duration-300 shadow-lg"
              >
                Go to Login
              </button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-500/15 border border-red-500/35 rounded-2xl p-4 text-sm text-red-300 flex items-center gap-2 animate-shake">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-300 mb-1">New Password</label>
                <PasswordInput 
                  value={newPassword}
                  onChange={setNewPassword}
                  disabled={isSubmitting}
                  placeholder="Enter new password"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-300 mb-1">Confirm Password</label>
                <PasswordInput 
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  disabled={isSubmitting}
                  placeholder="Confirm new password"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || !isStrong || newPassword !== confirmPassword}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-blue-600/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
