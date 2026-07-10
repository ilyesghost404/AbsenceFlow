import EmptyState from './EmptyState';

const Table = ({ columns, data, className = '', emptyMessage = 'No data available' }) => {
  if (!data || data.length === 0) {
    return <EmptyState title={emptyMessage} />;
  }

  return (
    <div className={`overflow-x-auto rounded-xl border border-slate-100 ${className}`}>
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-gradient-to-r from-slate-50 to-white">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-100">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-slate-50 transition-colors duration-200">
              {columns.map((column, colIndex) => (
                <td key={colIndex} className={`px-6 py-4 text-sm text-slate-700 ${column.cellClassName || 'whitespace-nowrap'}`}>
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
