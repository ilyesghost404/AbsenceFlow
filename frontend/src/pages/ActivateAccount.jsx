import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import Button from '../components/Button';
import FaceRegistration from '../components/FaceRegistration';

const ActivateAccount = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('checking'); // checking | valid | invalid | pending_face | success
  const [employeeId, setEmployeeId] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');

  useEffect(() => {
    if (!token) {
      setVerificationStatus('invalid');
      return;
    }

    const checkToken = async () => {
      try {
        await api.get(`/users/activate-account/verify?token=${token}`);
        setVerificationStatus('valid');
      } catch (error) {
        console.error('Token verification error:', error);
        setVerificationStatus('invalid');
      }
    };

    checkToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.post('/users/activate-account', { token, password });
      toast.success('Password created successfully');
      
      const { employeeId, requiresFace } = res.data.data;
      if (requiresFace && employeeId) {
        setEmployeeId(employeeId);
        setVerificationStatus('pending_face');
      } else {
        setVerificationStatus('success');
      }
    } catch (error) {
      console.error('Activation error:', error);
      toast.error(error.response?.data?.message || 'Failed to activate account. The link may be expired.');
    } finally {
      setIsLoading(false);
    }
  };

  if (verificationStatus === 'checking') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-slate-700">Checking activation link...</h2>
      </div>
    );
  }

  if (verificationStatus === 'invalid') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100 text-center">
            <ShieldCheck className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Invalid Link</h2>
            <p className="text-slate-500 mb-6">Invalid or expired activation link.</p>
            <Button className="w-full" onClick={() => navigate('/login')}>Return to Login</Button>
          </div>
        </div>
      </div>
    );
  }
  
  if (verificationStatus === 'pending_face') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-slate-100/80">
            <div className="text-center mb-6">
              <ShieldCheck className="mx-auto h-12 w-12 text-blue-600 mb-2" />
              <h2 className="text-2xl font-bold text-slate-900">Secure Your Account</h2>
              <p className="text-slate-500 text-xs mt-1">
                Face ID registration is required to use secure attendance verification.
              </p>
            </div>
            
            <FaceRegistration
              employeeId={employeeId}
              token={token}
              onSuccess={() => {
                setVerificationStatus('success');
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'success') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100 text-center">
            <ShieldCheck className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Success!</h2>
            <p className="text-slate-500 mb-6">Account activated successfully.</p>
            <Button className="w-full" onClick={() => navigate('/login')}>Proceed to Login</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100/50 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-100/50 blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <span className="text-white font-bold text-2xl">AF</span>
          </div>
        </div>
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">
          Activate Your Account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Set up your secure password to get started
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700">New Password</label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Confirm Password</label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full justify-center py-3 text-base"
              isLoading={isLoading}
              icon={ShieldCheck}
            >
              Activate Account
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ActivateAccount;
