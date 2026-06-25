import * as React from 'react';

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T;
  render?: (row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  emptyMessage = 'No data available',
  className = '',
}: DataTableProps<T>) {
  return (
    <div className={`w-full overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 ${className}`}>
      <table className="w-full border-collapse text-left text-sm text-zinc-300">
        <thead className="bg-zinc-900/80 text-xs font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
          <tr>
            {columns.map((column, index) => (
              <th key={index} className="px-6 py-4 font-semibold">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800 bg-zinc-950/40">
          {data.length > 0 ? (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="transition-colors hover:bg-zinc-900/40"
              >
                {columns.map((column, colIndex) => {
                  let cellContent: React.ReactNode = null;
                  if (column.render) {
                    cellContent = column.render(row);
                  } else if (column.accessorKey) {
                    const val = row[column.accessorKey];
                    cellContent = val !== undefined && val !== null ? String(val) : '';
                  }
                  return (
                    <td key={colIndex} className="px-6 py-4 whitespace-nowrap align-middle">
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-10 text-center text-zinc-500"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
