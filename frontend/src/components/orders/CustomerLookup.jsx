import { useState, useEffect, useRef } from 'react';
import { customerApi } from '../../api/customerApi';

export default function CustomerLookup({ value, onChange }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    async function searchCustomers() {
      if (search.length < 2) {
        setResults([]);
        setShowResults(false);
        return;
      }
      setLoading(true);
      try {
        const response = await customerApi.list({ search });
        setResults(response.data.data);
        setShowResults(true);
      } catch (err) {
        console.error('Error searching customers:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }
    const debounceTimer = setTimeout(searchCustomers, 300);
    return () => clearTimeout(debounceTimer);
  }, [search]);

  useEffect(() => {
    async function loadCustomer() {
      if (value) {
        try {
          const response = await customerApi.get(value);
          setSelectedCustomer(response.data.data);
          setSearch(response.data.data.name);
        } catch (err) {
          console.error('Error loading customer:', err);
        }
      } else {
        setSelectedCustomer(null);
        setSearch('');
      }
    }
    loadCustomer();
  }, [value]);

  function handleSelect(customer) {
    setSelectedCustomer(customer);
    setSearch(customer.name);
    setShowResults(false);
    onChange(customer.id);
  }

  function handleClear() {
    setSelectedCustomer(null);
    setSearch('');
    setShowResults(false);
    onChange('');
  }

  function handleClickOutside(event) {
    if (resultsRef.current && !resultsRef.current.contains(event.target) && inputRef.current && !inputRef.current.contains(event.target)) {
      setShowResults(false);
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="position-relative">
      <label className="form-label small">Customer</label>
      <div className="input-group">
        <input
          ref={inputRef}
          className="form-control form-control-sm"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or mobile..."
          onFocus={() => search.length >= 2 && setShowResults(true)}
        />
        {selectedCustomer && (
          <button className="btn btn-outline-secondary btn-sm" type="button" onClick={handleClear}>
            <i className="bi bi-x-lg" />
          </button>
        )}
      </div>
      {loading && <div className="form-text small">Searching...</div>}
      {showResults && results.length > 0 && (
        <div ref={resultsRef} className="position-absolute w-100 bg-white border rounded-2 mt-1 shadow" style={{ zIndex: 1000, maxHeight: '300px', overflowY: 'auto' }}>
          {results.map((customer) => (
            <div
              key={customer.id}
              className="p-2 cursor-pointer hover-bg-light"
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
              onClick={() => handleSelect(customer)}
            >
              <div className="fw-bold small">{customer.name}</div>
              <div className="text-muted small">{customer.mobile}</div>
            </div>
          ))}
        </div>
      )}
      {showResults && results.length === 0 && search.length >= 2 && (
        <div className="position-absolute w-100 bg-white border rounded-2 mt-1 p-2 shadow small text-muted" style={{ zIndex: 1000 }}>
          No customers found
        </div>
      )}
    </div>
  );
}
