import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ROWS_PER_PAGE = 25;

export default function Analytics() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('events')
        .select('id, user_id, event_name, timestamp, properties');

      if (fetchError) throw fetchError;
      setEvents(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredEvents = useMemo(() => {
    if (!searchTerm.trim()) return events;
    const lowerSearch = searchTerm.toLowerCase();
    return events.filter((event) =>
      event.event_name?.toLowerCase().includes(lowerSearch)
    );
  }, [events, searchTerm]);

  const sortedEvents = useMemo(() => {
    const sorted = [...filteredEvents];
    sorted.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === 'properties') {
        aVal = JSON.stringify(aVal || {});
        bVal = JSON.stringify(bVal || {});
      }

      if (sortConfig.key === 'timestamp') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (sortConfig.direction === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    return sorted;
  }, [filteredEvents, sortConfig]);

  const totalPages = Math.ceil(sortedEvents.length / ROWS_PER_PAGE);

  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    return sortedEvents.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [sortedEvents, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortConfig]);

  function handleSort(key) {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }

  function getSortIndicator(key) {
    if (sortConfig.key !== key) return '';
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  }

  function exportToCSV() {
    if (sortedEvents.length === 0) return;

    const headers = ['id', 'user_id', 'event_name', 'timestamp', 'properties'];
    const csvRows = [];

    csvRows.push(headers.join(','));

    sortedEvents.forEach((event) => {
      const row = headers.map((header) => {
        let value = event[header];
        if (header === 'properties') {
          value = JSON.stringify(value || {});
        }
        if (value === null || value === undefined) {
          value = '';
        }
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `events_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function formatTimestamp(timestamp) {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString();
  }

  function formatProperties(properties) {
    if (!properties || Object.keys(properties).length === 0) return '-';
    return JSON.stringify(properties, null, 2);
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading events...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>Error: {error}</div>
        <button onClick={fetchEvents} style={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Analytics Events</h1>

      <div style={styles.controls}>
        <input
          type="text"
          placeholder="Search by event name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
        <button onClick={exportToCSV} style={styles.exportButton} disabled={sortedEvents.length === 0}>
          Export CSV
        </button>
      </div>

      <div style={styles.info}>
        Showing {paginatedEvents.length} of {sortedEvents.length} events
        {searchTerm && ` (filtered from ${events.length} total)`}
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th} onClick={() => handleSort('id')}>
                ID{getSortIndicator('id')}
              </th>
              <th style={styles.th} onClick={() => handleSort('user_id')}>
                User ID{getSortIndicator('user_id')}
              </th>
              <th style={styles.th} onClick={() => handleSort('event_name')}>
                Event Name{getSortIndicator('event_name')}
              </th>
              <th style={styles.th} onClick={() => handleSort('timestamp')}>
                Timestamp{getSortIndicator('timestamp')}
              </th>
              <th style={styles.th} onClick={() => handleSort('properties')}>
                Properties{getSortIndicator('properties')}
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedEvents.length === 0 ? (
              <tr>
                <td colSpan={5} style={styles.noData}>
                  No events found
                </td>
              </tr>
            ) : (
              paginatedEvents.map((event) => (
                <tr key={event.id} style={styles.tr}>
                  <td style={styles.td}>{event.id}</td>
                  <td style={styles.td}>{event.user_id || '-'}</td>
                  <td style={styles.td}>{event.event_name || '-'}</td>
                  <td style={styles.td}>{formatTimestamp(event.timestamp)}</td>
                  <td style={styles.tdProperties}>
                    <pre style={styles.pre}>{formatProperties(event.properties)}</pre>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              ...styles.pageButton,
              ...(currentPage === 1 ? styles.pageButtonDisabled : {}),
            }}
          >
            Previous
          </button>
          <span style={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              ...styles.pageButton,
              ...(currentPage === totalPages ? styles.pageButtonDisabled : {}),
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    marginBottom: '24px',
    color: '#1a1a2e',
  },
  controls: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  searchInput: {
    padding: '10px 16px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    width: '300px',
    outline: 'none',
  },
  exportButton: {
    padding: '10px 20px',
    fontSize: '14px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  info: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '12px',
  },
  tableWrapper: {
    overflowX: 'auto',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    backgroundColor: '#f9fafb',
    borderBottom: '2px solid #e5e7eb',
    fontWeight: '600',
    color: '#374151',
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid #e5e7eb',
  },
  td: {
    padding: '12px 16px',
    verticalAlign: 'top',
    color: '#4b5563',
  },
  tdProperties: {
    padding: '12px 16px',
    verticalAlign: 'top',
    color: '#4b5563',
    maxWidth: '300px',
  },
  pre: {
    margin: 0,
    fontSize: '12px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    backgroundColor: '#f3f4f6',
    padding: '8px',
    borderRadius: '4px',
  },
  noData: {
    padding: '40px',
    textAlign: 'center',
    color: '#9ca3af',
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    marginTop: '20px',
    padding: '16px 0',
  },
  pageButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    color: '#374151',
  },
  pageButtonDisabled: {
    backgroundColor: '#f3f4f6',
    color: '#9ca3af',
    cursor: 'not-allowed',
  },
  pageInfo: {
    fontSize: '14px',
    color: '#6b7280',
  },
  loading: {
    textAlign: 'center',
    padding: '60px',
    fontSize: '16px',
    color: '#6b7280',
  },
  error: {
    textAlign: 'center',
    padding: '20px',
    fontSize: '16px',
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  retryButton: {
    display: 'block',
    margin: '0 auto',
    padding: '10px 24px',
    fontSize: '14px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};