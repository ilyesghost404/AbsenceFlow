import EmptyState from './EmptyState';

const Table = ({ columns, data, className = '', emptyMessage = 'No data available' }) => {
  if (!data || data.length === 0) {
    return <EmptyState title={emptyMessage} />;
  }

  return (
    <div className={`overflow-x-auto rounded-3xl border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${className}`}>
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-slate-50/50 backdrop-blur-xl sticky top-0 z-10">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className="px-4 sm:px-8 py-4 sm:py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-50">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-slate-50/60 transition-colors duration-200 group">
              {columns.map((column, colIndex) => (
                <td key={colIndex} className={`px-4 sm:px-8 py-4 sm:py-5 text-sm text-slate-700 ${column.cellClassName || 'whitespace-nowrap'} group-hover:text-slate-900`}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
