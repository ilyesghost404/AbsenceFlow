const Card = ({ children, className = '', title, actions, hover, noPadding = false }) => {
  return (
    <div className={`
      bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden
      ${hover ? 'transition-all duration-300 hover:shadow-xl hover:-translate-y-1' : ''}
      ${className}
    `}>
      {title && (
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
          {typeof title === 'string' ? (
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          ) : (
            title
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {noPadding ? children : <div className="p-6">{children}</div>}
    </div>
  );
};

export default Card;
