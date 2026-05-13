import React, { useState, useEffect } from 'react';
import { subscribeToAllReports, updateReportStatus, type OutageReport, type UnifiedStatus, formatDate } from '../../services/db';
import { Search, MessageSquare, ChevronDown, ChevronUp, Pencil, Lock } from 'lucide-react';

export const AdminTickets = () => {
  const [reports, setReports] = useState<OutageReport[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<UnifiedStatus | 'all'>('all');
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAllReports(setReports);
    return () => unsubscribe();
  }, []);

  const filteredReports = reports.filter(r => {
    const matchesSearch = r.location.toLowerCase().includes(search.toLowerCase()) || 
                         r.description.toLowerCase().includes(search.toLowerCase()) ||
                         (r.userName && r.userName.toLowerCase().includes(search.toLowerCase())) ||
                         r.uid.toLowerCase().includes(search.toLowerCase()) ||
                         (r.issueType && r.issueType.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleUpdate = async (id: string, status: UnifiedStatus) => {
    try {
      await updateReportStatus(id, status, feedback[id]);
      setFeedback(prev => ({ ...prev, [id]: '' }));
      alert("Ticket updated!");
    } catch (error) {
      console.error(error);
      alert("Update failed.");
    }
  };

  return (
    <div className="animate-fade-in">
      <h2 style={{ marginBottom: '2rem', color: 'var(--primary-color)' }}>All Tickets Table</h2>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
          <input 
            className="input-field" 
            placeholder="Search by location, description, or user ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '3rem', width: '100%' }}
          />
        </div>
        <select 
          className="input-field" 
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          style={{ width: '200px' }}
        >
          <option value="all">All Statuses</option>
          <option value="reported">Reported</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="in-progress">In-Progress</option>
          <option value="resolved">Resolved</option>
          <option value="false-alarm">False Alarm</option>
        </select>
      </div>

      <div className="glass-panel" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-hover)' }}>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Name</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Location</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Issue Type</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Date</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map(report => (
              <React.Fragment key={report.id}>
                <tr 
                  style={{ 
                    borderBottom: '1px solid var(--color-border)', 
                    cursor: 'pointer',
                    background: expandedId === report.id ? 'rgba(37, 99, 235, 0.03)' : 'transparent'
                  }}
                  onClick={() => setExpandedId(expandedId === report.id ? null : report.id!)}
                >
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem' }}>{report.userName || 'Unknown User'}</td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 500 }}>{report.location}</td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem' }}>{report.issueType}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`status-badge status-${report.status}`} style={{ fontSize: '0.75rem' }}>
                        {report.status.replace('-', ' ')}
                      </span>
                      {!['resolved', 'false-alarm'].includes(report.status) ? (
                        <Pencil size={12} style={{ opacity: 0.5 }} />
                      ) : (
                        <Lock size={12} style={{ opacity: 0.3 }} />
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', opacity: 0.7 }}>
                    {formatDate(report.createdAt)}
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    {expandedId === report.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </td>
                </tr>
                {expandedId === report.id && (
                  <tr>
                    <td colSpan={6} style={{ padding: '1.5rem', background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                          <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--primary-color)' }}>Full Description:</p>
                          <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{report.description}</p>
                        </div>
                        {['resolved', 'false-alarm'].includes(report.status) ? (
                          <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: 0.6 }}>
                            <Lock size={16} />
                            <p style={{ fontSize: '0.85rem', margin: 0 }}>This ticket is closed and cannot be modified.</p>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'var(--color-surface-hover)', padding: '1rem', borderRadius: '8px' }}>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <MessageSquare size={16} style={{ opacity: 0.5 }} />
                              <input 
                                className="input-field" 
                                placeholder="Add feedback for the user..."
                                value={feedback[report.id!] || ''}
                                onChange={e => setFeedback(prev => ({ ...prev, [report.id!]: e.target.value }))}
                                onClick={e => e.stopPropagation()}
                                style={{ flex: 1, border: 'none', padding: '0.25rem' }}
                              />
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
                              <select 
                                className="input-field"
                                onChange={(e) => e.target.value && handleUpdate(report.id!, e.target.value as UnifiedStatus)}
                                defaultValue=""
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', width: 'auto' }}
                              >
                                <option value="" disabled>Update Status...</option>
                                <option value="acknowledged">Acknowledge</option>
                                <option value="in-progress">Mark In-Progress</option>
                                <option value="resolved">Resolve Ticket</option>
                                <option value="false-alarm">Mark False Alarm</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {filteredReports.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>
            No tickets found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};
