import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import toast from 'react-hot-toast';
import { Check, RefreshCw, AlertTriangle, UserCheck } from 'lucide-react';
import { registerFace } from '../services/employeeService';
import CameraCapture from './CameraCapture';

const RegisterFaceModal = ({ isOpen, onClose, employee }) => {
  const [step, setStep] = useState(0); // 0: Front, 1: Left, 2: Right, 3: Review, 4: Loading
  const [captures, setCaptures] = useState({ front: null, left: null, right: null });
  const [error, setError] = useState('');

  // Steps configuration
  const stepsConfig = [
    { label: 'Front Face', instruction: 'Look straight into the camera, aligning your face with the guide.' },
    { label: 'Left Angle', instruction: 'Turn your head slightly to the left, showing your right profile.' },
    { label: 'Right Angle', instruction: 'Turn your head slightly to the right, showing your left profile.' },
  ];

  const handleFaceCapture = (base64Image) => {
    const stepKeys = ['front', 'left', 'right'];
    setCaptures(prev => ({
      ...prev,
      [stepKeys[step]]: base64Image
    }));

    if (step < 2) {
      setStep(prev => prev + 1);
    } else {
      setStep(3); // Go to review
    }
  };

  const handleReset = () => {
    setCaptures({ front: null, left: null, right: null });
    setStep(0);
    setError('');
  };

  const handleSubmit = async () => {
    setStep(4); // Loading state
    try {
      const imagesArray = [captures.front, captures.left, captures.right];
      await registerFace(employee.id, imagesArray);
      toast.success('Face profile registered successfully!');
      onClose();
      handleReset();
    } catch (err) {
      console.error('Register face error:', err);
      const errMsg = err.response?.data?.message || 'Face registration failed. Please try again.';
      setError(errMsg);
      setStep(3); // Back to review step
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); }} title={`Register Face - ${employee?.first_name} ${employee?.last_name}`} size="lg">
      <div className="space-y-6">
        {step < 3 && (
          <div className="flex flex-col items-center">
            {/* Step Indicators */}
            <div className="flex items-center gap-2 mb-6 w-full max-w-md">
              {stepsConfig.map((s, idx) => (
                <div key={idx} className="flex-1 flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${
                    step === idx ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' : 
                    step > idx ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}>
                    {step > idx ? <Check size={14} /> : idx + 1}
                  </div>
                  <div className="ml-2 text-xs font-semibold text-slate-700 hidden sm:block">{s.label}</div>
                  {idx < 2 && <div className="flex-1 h-0.5 bg-slate-200 mx-2" />}
                </div>
              ))}
            </div>

            {/* Instruction Card */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 w-full text-center mb-6">
              <h4 className="font-bold text-slate-800 text-base">{stepsConfig[step].label}</h4>
              <p className="text-slate-500 text-xs mt-1">{stepsConfig[step].instruction}</p>
            </div>

            {/* Camera Container */}
            <CameraCapture
              onCapture={handleFaceCapture}
              facingMode="user"
              showGuide={true}
              actionButtonLabel={`Capture ${stepsConfig[step].label}`}
            />
          </div>
        )}

        {/* Review Captured Shots */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
              <h4 className="font-bold text-slate-800 text-base">Review Captures</h4>
              <p className="text-slate-500 text-xs mt-1">Check that all three angles are clear, well-lit, and show your face clearly.</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-4 text-xs text-red-600 flex items-center gap-2">
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              {Object.keys(captures).map((key) => (
                <div key={key} className="flex flex-col items-center gap-2">
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 w-full shadow-sm">
                    <img src={captures[key]} alt={key} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{key} Profile</span>
                </div>
              ))}
            </div>

            <div className="flex gap-4 justify-end pt-4 border-t border-slate-100">
              <Button variant="secondary" onClick={handleReset} className="rounded-xl">
                <RefreshCw size={16} className="mr-1.5" /> Retake All
              </Button>
              <Button variant="success" onClick={handleSubmit} className="rounded-xl shadow-lg shadow-emerald-500/20" icon={UserCheck}>
                Register Face Profile
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {step === 4 && (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
            <h4 className="font-bold text-slate-800 text-lg">Analyzing Profiles</h4>
            <p className="text-slate-500 text-sm mt-1 max-w-sm">
              We are generating AI facial embeddings and securing the biometric signature. This takes just a moment...
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default RegisterFaceModal;
