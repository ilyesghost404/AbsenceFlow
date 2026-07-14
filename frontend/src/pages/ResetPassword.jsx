import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '../services/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Password strength logic
  const [strength, setStrength] = useState({ score: 0, label: 'Weak', color: 'bg-red-500' });

  useEffect(() => {
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[a-z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;

    if (newPassword.length === 0) {
      setStrength({ score: 0, label: '', color: 'bg-slate-700' });
    } else if (score < 3) {
      setStrength({ score, label: 'Weak', color: 'bg-red-500' });
    } else if (score < 5) {
      setStrength({ score, label: 'Medium', color: 'bg-amber-500' });
    } else {
      setStrength({ score, label: 'Strong', color: 'bg-emerald-500' });
    }
  }, [newPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid or missing reset token.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (strength.score < 3) {
      setError('Please choose a stronger password');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post('/users/reset-password', { token, newPassword });
      if (response.data.success) {
        setSuccess(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token && !success) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 py-12 px-4">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 text-center shadow-xl border border-slate-700">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-white mb-2">Invalid Link</h2>
          <p className="text-slate-400 mb-6">This password reset link is invalid or missing.</p>
          <button onClick={() => navigate('/login')} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">
            Back to Login
          </button>
        </div>
      </div>
    );
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
                <label className="block text-sm font-medium text-slate-300">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full pl-10 pr-12 py-3 bg-slate-800/40 border border-slate-700/50 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-slate-800/80 transition-all text-sm"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                {/* Password Strength Meter */}
                {newPassword && (
                  <div className="pt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-400">Password strength</span>
                      <span className={`text-xs font-bold ${
                        strength.label === 'Weak' ? 'text-red-400' : 
                        strength.label === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="flex gap-1 h-1.5">
                      <div className={`flex-1 rounded-full ${strength.score >= 1 ? strength.color : 'bg-slate-700'}`}></div>
                      <div className={`flex-1 rounded-full ${strength.score >= 3 ? strength.color : 'bg-slate-700'}`}></div>
                      <div className={`flex-1 rounded-full ${strength.score >= 4 ? strength.color : 'bg-slate-700'}`}></div>
                      <div className={`flex-1 rounded-full ${strength.score >= 5 ? strength.color : 'bg-slate-700'}`}></div>
                    </div>
                    <ul className="text-[10px] text-slate-500 mt-2 space-y-0.5">
                      <li className={newPassword.length >= 8 ? 'text-emerald-400' : ''}>• At least 8 characters</li>
                      <li className={/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? 'text-emerald-400' : ''}>• Upper & lowercase letters</li>
                      <li className={/[0-9]/.test(newPassword) ? 'text-emerald-400' : ''}>• At least one number</li>
                      <li className={/[^A-Za-z0-9]/.test(newPassword) ? 'text-emerald-400' : ''}>• At least one special character</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-300">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-12 py-3 bg-slate-800/40 border border-slate-700/50 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-slate-800/80 transition-all text-sm"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || strength.score < 3 || newPassword !== confirmPassword}
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
