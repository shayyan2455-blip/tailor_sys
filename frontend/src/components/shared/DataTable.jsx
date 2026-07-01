import { useMemo, useState } from 'react';

export default function DataTable({ columns, rows, keyField = 'id', pageSize = 12, emptyText = 'No records found', actions, rowClassName, disableSort = false, searchable = false, search: externalSearch }) {
  const [sort, setSort] = useState(disableSort ? null : { key: columns[0]?.key, dir: 'asc' });
  const [page, setPage] = useState(1);
  const [internalSearch, setInternalSearch] = useState('');
  const search = externalSearch !== undefined ? externalSearch : internalSearch;

  const filteredRows = useMemo(() => {
    if (!search || !searchable) return rows || [];
    const searchLower = search.toLowerCase();
    return (rows || []).filter(row => {
      return columns.some(column => {
        const value = column.render ? column.render(row) : row[column.key];
        return String(value).toLowerCase().includes(searchLower);
      });
    });
  }, [rows, search, searchable, columns]);

  const sortedRows = useMemo(() => {
    const data = [...filteredRows];
    if (disableSort || !sort) return data;
    return data.sort((a, b) => {
      const left = a[sort.key] ?? '';
      const right = b[sort.key] ?? '';
      const result = String(left).localeCompare(String(right), undefined, { numeric: true });
      return sort.dir === 'asc' ? result : -result;
    });
  }, [filteredRows, sort, disableSort]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const visibleRows = sortedRows.slice((page - 1) * pageSize, page * pageSize);

  function toggleSort(key) {
    setSort((current) => ({
      key,
      dir: current.key === key && current.dir === 'asc' ? 'desc' : 'asc'
    }));
  }

  // Reset to page 1 when search changes
  function handleSearchChange(value) {
    setInternalSearch(value);
    setPage(1);
  }

  return (
    <div className="bg-white border rounded-2 overflow-hidden">
      {searchable && externalSearch === undefined && (
        <div className="p-2 border-bottom">
          <div className="input-group input-group-sm">
            <span className="input-group-text"><i className="bi bi-search" /></span>
            <input
              className="form-control"
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {search && (
              <button className="btn btn-outline-secondary" type="button" onClick={() => handleSearchChange('')}>
                <i className="bi bi-x-lg" />
              </button>
            )}
          </div>
        </div>
      )}
      <div className="table-responsive">
        <table className="table table-sm table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              {columns.map((column) => (
                <th key={column.key} style={{ width: column.width }}>
                  {disableSort ? (
                    <span className="fw-semibold">{column.label}</span>
                  ) : (
                    <button className="btn btn-link btn-sm p-0 text-decoration-none text-reset fw-semibold" type="button" onClick={() => toggleSort(column.key)}>
                      {column.label}
                      {sort?.key === column.key && <i className={`bi ms-1 ${sort.dir === 'asc' ? 'bi-sort-up' : 'bi-sort-down'}`} />}
                    </button>
                  )}
                </th>
              ))}
              {actions && <th className="text-end">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, index) => (
              <tr key={row[keyField] ?? `${page}-${index}`} className={rowClassName ? rowClassName(row) : ''}>
                {columns.map((column) => (
                  <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>
                ))}
                {actions && <td className="text-end text-nowrap">{actions(row)}</td>}
              </tr>
            ))}
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center text-muted py-4">{search ? 'No matching records found' : emptyText}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="d-flex align-items-center justify-content-between px-2 py-1 border-top small">
        <span>{sortedRows.length} rows{search && ` (filtered from ${rows?.length || 0} total)`}</span>
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
