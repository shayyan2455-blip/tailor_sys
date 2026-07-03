import { useState, useEffect, useRef } from 'react';
import { customerApi } from '../../api/customerApi';

export default function CustomerLookup({ value, onChange }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
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
        const response = await customerApi.list({ search: search.toLowerCase() });
        setResults(response.data.data);
        setShowResults(true);
        setHighlightedIndex(-1);
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
    setHighlightedIndex(-1);
    onChange(customer.id);
  }

  function handleClear() {
    setSelectedCustomer(null);
    setSearch('');
    setShowResults(false);
    setHighlightedIndex(-1);
    onChange('');
  }

  function handleClickOutside(event) {
    if (resultsRef.current && !resultsRef.current.contains(event.target) && inputRef.current && !inputRef.current.contains(event.target)) {
      setShowResults(false);
      setHighlightedIndex(-1);
    }
  }

  function handleKeyDown(event) {
    if (!showResults || results.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        event.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < results.length) {
          handleSelect(results[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setHighlightedIndex(-1);
        break;
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
          onKeyDown={handleKeyDown}
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
          {results.map((customer, index) => (
            <div
              key={customer.id}
              className="p-2 cursor-pointer hover-bg-light"
              style={{
                cursor: 'pointer',
                backgroundColor: index === highlightedIndex ? '#f8f9fa' : ''
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
              onMouseLeave={() => setHighlightedIndex(-1)}
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
