import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      {/* Modal */}
      <div className={`
        relative bg-white rounded-2xl shadow-2xl w-full mx-4 max-h-[90vh] overflow-hidden
        animate-in fade-in zoom-in duration-200
        ${sizes[size]}
      `}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <X className="text-slate-500" size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
