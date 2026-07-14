const Card = ({ children, className = '', title, actions, hover, noPadding = false }) => {
  return (
    <div className={`
      bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden
      ${hover ? 'transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-slate-200 hover:-translate-y-1' : ''}
      ${className}
    `}>
      {title && (
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          {typeof title === 'string' ? (
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h3>
          ) : (
            title
          )}
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
      )}
      {noPadding ? children : <div className="p-8">{children}</div>}
    </div>
  );
};

export default Card;
