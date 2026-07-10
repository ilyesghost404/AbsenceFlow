import { AlertCircle } from 'lucide-react';

const ErrorMessage = ({ message, className = '' }) => {
  return (
    <div className={`flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl ${className}`}>
      <AlertCircle className="text-red-500 flex-shrink-0" size={24} />
      <p className="text-red-700 font-semibold">{message}</p>
    </div>
  );
};

export default ErrorMessage;