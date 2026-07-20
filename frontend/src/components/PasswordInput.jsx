import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

const PasswordInput = ({ value, onChange, placeholder = "Enter password", disabled = false }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState({ score: 0, label: '', color: 'bg-slate-200' });
  const [checks, setChecks] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  useEffect(() => {
    const newChecks = {
      length: value.length >= 8,
      uppercase: /[A-Z]/.test(value),
      lowercase: /[a-z]/.test(value),
      number: /[0-9]/.test(value),
      special: /[!@#$%^&*()[\]{}\\|;:'",.<>/?~_+-=]/.test(value)
    };
    
    setChecks(newChecks);

    if (value.length === 0) {
      setStrength({ score: 0, label: '', color: 'bg-slate-200' });
      return;
    }

    let score = Object.values(newChecks).filter(Boolean).length;
    
    // In our strict rules, it's only "Strong" (valid) if it meets ALL 5.
    if (score < 3) {
      setStrength({ score, label: 'Weak', color: 'bg-red-500' });
    } else if (score < 5) {
      setStrength({ score, label: 'Medium', color: 'bg-amber-500' });
    } else {
      setStrength({ score, label: 'Strong', color: 'bg-emerald-500' });
    }
  }, [value]);

  return (
    <div className="space-y-2 w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Lock className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type={showPassword ? 'text' : 'password'}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="block w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all bg-white disabled:bg-slate-50 disabled:text-slate-500"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 disabled:opacity-50"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {value && (
        <div className="pt-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-slate-500">Password strength</span>
            <span className={`text-xs font-bold ${
              strength.label === 'Weak' ? 'text-red-500' : 
              strength.label === 'Medium' ? 'text-amber-500' : 'text-emerald-500'
            }`}>
              {strength.label}
            </span>
          </div>
          <div className="flex gap-1 h-1.5 mb-2">
            <div className={`flex-1 rounded-full ${strength.score >= 1 ? strength.color : 'bg-slate-200'}`}></div>
            <div className={`flex-1 rounded-full ${strength.score >= 2 ? strength.color : 'bg-slate-200'}`}></div>
            <div className={`flex-1 rounded-full ${strength.score >= 3 ? strength.color : 'bg-slate-200'}`}></div>
            <div className={`flex-1 rounded-full ${strength.score >= 4 ? strength.color : 'bg-slate-200'}`}></div>
            <div className={`flex-1 rounded-full ${strength.score === 5 ? strength.color : 'bg-slate-200'}`}></div>
          </div>
          <ul className="text-xs text-slate-500 space-y-1 grid grid-cols-2 gap-x-2">
            <li className={`flex items-center gap-1.5 ${checks.length ? 'text-emerald-600' : ''}`}>
              {checks.length ? '✅' : '❌'} Min 8 chars
            </li>
            <li className={`flex items-center gap-1.5 ${checks.uppercase ? 'text-emerald-600' : ''}`}>
              {checks.uppercase ? '✅' : '❌'} Uppercase
            </li>
            <li className={`flex items-center gap-1.5 ${checks.lowercase ? 'text-emerald-600' : ''}`}>
              {checks.lowercase ? '✅' : '❌'} Lowercase
            </li>
            <li className={`flex items-center gap-1.5 ${checks.number ? 'text-emerald-600' : ''}`}>
              {checks.number ? '✅' : '❌'} Number
            </li>
            <li className={`flex items-center gap-1.5 ${checks.special ? 'text-emerald-600' : ''}`}>
              {checks.special ? '✅' : '❌'} Special (!@#$)
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default PasswordInput;
