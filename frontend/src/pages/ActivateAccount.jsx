import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import Button from '../components/Button';
import FaceRegistration from '../components/FaceRegistration';
import PasswordInput from '../components/PasswordInput';

const ActivateAccount = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

    const isStrong = password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[!@#$%^&*()[\]{}\\|;:'",.<>/?~_+-=]/.test(password);
    if (!isStrong) {
      toast.error('Please choose a stronger password that meets all requirements');
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
              <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
              <PasswordInput 
                value={password} 
                onChange={setPassword} 
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
              <PasswordInput 
                value={confirmPassword} 
                onChange={setConfirmPassword} 
                disabled={isLoading}
                placeholder="Confirm your password"
              />
            </div>

            <Button
              type="submit"
              className="w-full flex justify-center py-3"
              disabled={
                isLoading || 
                !password || 
                password !== confirmPassword ||
                !(password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[!@#$%^&*()[\]{}\\|;:'",.<>/?~_+-=]/.test(password))
              }
            >
              {isLoading ? (
                <Loader2 className="animate-spin h-5 w-5 text-white" />
              ) : (
                'Set Password & Activate'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ActivateAccount;
