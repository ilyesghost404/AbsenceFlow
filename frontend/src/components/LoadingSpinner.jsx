const LoadingSpinner = ({ size = 'md', className = '', text = '' }) => {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-[3px]',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 animate-fade-in ${className}`}>
      <div className="relative">
        <div
          className={`
            animate-spin rounded-full border-solid border-blue-600 border-t-transparent
            ${sizes[size]}
          `}
        />
        <div
          className={`
            absolute inset-0 animate-spin rounded-full border-solid border-blue-200 border-t-transparent opacity-30
            ${sizes[size]}
          `}
          style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
        />
      </div>
      {text && (
        <p className="text-sm font-medium text-slate-500 animate-pulse">{text}</p>
      )}
    </div>
  );
};

// Skeleton shimmer row for table loading states
export const SkeletonRow = ({ columns = 5 }) => (
  <div className="animate-pulse flex items-center gap-4 px-6 py-4 border-b border-slate-50">
    <div className="w-10 h-10 bg-slate-200 rounded-full flex-shrink-0" />
    <div className="flex-1 grid gap-4" style={{ gridTemplateColumns: `repeat(${columns - 1}, 1fr)` }}>
      {Array.from({ length: columns - 1 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className={`h-3 bg-slate-200 rounded-full ${i === 0 ? 'w-3/4' : 'w-1/2'}`} />
          {i === 0 && <div className="h-2 bg-slate-100 rounded-full w-1/2" />}
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5, columns = 5 }) => (
  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
    <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100">
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-3 bg-slate-200 rounded-full w-20" />
        ))}
      </div>
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <SkeletonRow key={i} columns={columns} />
    ))}
  </div>
);

export default LoadingSpinner;