import { useMemo, useState } from 'react';

export default function DataTable({ columns, rows, keyField = 'id', pageSize = 12, emptyText = 'No records found', actions }) {
  const [sort, setSort] = useState({ key: columns[0]?.key, dir: 'asc' });
  const [page, setPage] = useState(1);

  const sortedRows = useMemo(() => {
    const data = [...(rows || [])];
    if (!sort.key) return data;
    return data.sort((a, b) => {
      const left = a[sort.key] ?? '';
      const right = b[sort.key] ?? '';
      const result = String(left).localeCompare(String(right), undefined, { numeric: true });
      return sort.dir === 'asc' ? result : -result;
    });
  }, [rows, sort]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const visibleRows = sortedRows.slice((page - 1) * pageSize, page * pageSize);

  function toggleSort(key) {
    setSort((current) => ({
      key,
      dir: current.key === key && current.dir === 'asc' ? 'desc' : 'asc'
    }));
  }

  return (
    <div className="bg-white border rounded-2 overflow-hidden">
      <div className="table-responsive">
        <table className="table table-sm table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              {columns.map((column) => (
                <th key={column.key} style={{ width: column.width }}>
                  <button className="btn btn-link btn-sm p-0 text-decoration-none text-reset fw-semibold" type="button" onClick={() => toggleSort(column.key)}>
                    {column.label}
                    {sort.key === column.key && <i className={`bi ms-1 ${sort.dir === 'asc' ? 'bi-sort-up' : 'bi-sort-down'}`} />}
                  </button>
                </th>
              ))}
              {actions && <th className="text-end">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row[keyField]}>
                {columns.map((column) => (
                  <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>
                ))}
                {actions && <td className="text-end text-nowrap">{actions(row)}</td>}
              </tr>
            ))}
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center text-muted py-4">{emptyText}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="d-flex align-items-center justify-content-between px-2 py-1 border-top small">
        <span>{sortedRows.length} rows</span>
        <div className="btn-group btn-group-sm">
          <button className="btn btn-outline-secondary" type="button" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
            <i className="bi bi-chevron-left" />
          </button>
          <button className="btn btn-outline-secondary disabled" type="button">{page} / {pageCount}</button>
          <button className="btn btn-outline-secondary" type="button" disabled={page === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>
            <i className="bi bi-chevron-right" />
          </button>
        </div>
      </div>
    </div>
  );
}
