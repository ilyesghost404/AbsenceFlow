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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />
      {/* Modal */}
      <div className={`
        relative bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] w-full max-h-[90vh] overflow-hidden
        animate-in fade-in zoom-in-95 duration-300 ease-out flex flex-col
        ${sizes[size]}
      `}>
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100/80 bg-white/50 backdrop-blur-xl">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>
        <div className="p-8 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
