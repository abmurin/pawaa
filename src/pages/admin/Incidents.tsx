import { useState, useEffect } from 'react';
import { 
  subscribeToAllIncidents, 
  updateIncidentStatus, 
  type Incident, 
  type UnifiedStatus,
  subscribeToReportsByIncident,
  formatDate
} from '../../services/db';
import { ChevronRight, ChevronDown, Send, Clock, AlertTriangle, CheckCircle, Pencil, Lock } from 'lucide-react';

export const AdminIncidents = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [expandedIncidentId, setExpandedIncidentId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAllIncidents(setIncidents);
    return () => unsubscribe();
  }, []);

  const handleStatusUpdate = async (incidentId: string, status: UnifiedStatus) => {
    const incident = incidents.find(i => i.id === incidentId);
    const location = incident?.location || 'reported location';
    const message = feedback[incidentId] 
      ? `Status Update: ${status.toUpperCase().replace('-', ' ')}. Your report for ${location} has been updated. ${feedback[incidentId]}`
      : `Status Update: ${status.toUpperCase().replace('-', ' ')}. Your report for ${location} has been updated to ${status}.`;
    
    setUpdating(incidentId);
    try {
      await updateIncidentStatus(incidentId, status, message);
      alert(`Updated incident status to ${status}`);
      setFeedback(prev => ({ ...prev, [incidentId]: '' }));
    } catch (error) {
      console.error(error);
      alert("Failed to update incident.");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="animate-fade-in">
      <h2 style={{ marginBottom: '2rem', color: 'var(--primary-color)' }}>Aggregated Incidents</h2>
      
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {incidents.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
            <p>No active incidents found.</p>
          </div>
        ) : (
          incidents.map((incident) => (
            <div key={incident.id} className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
              <div 
                onClick={() => setExpandedIncidentId(expandedIncidentId === incident.id ? null : incident.id!)}
                style={{ 
                  padding: '1.5rem', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  background: expandedIncidentId === incident.id ? 'var(--color-surface-hover)' : 'transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {expandedIncidentId === incident.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  <div>
                    <h3 style={{ margin: 0 }}>{incident.location} - {incident.mainIssueType}</h3>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', opacity: 0.7, marginTop: '0.25rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={14} /> {formatDate(incident.createdAt)}
                      </span>
                      <span>Category: {incident.category}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span className="status-badge" style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary-color)' }}>
                    {incident.reportCount} Reports
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={`status-badge status-${incident.status}`}>
                      {incident.status.replace('-', ' ')}
                    </span>
                    {!['resolved', 'false-alarm'].includes(incident.status) ? (
                      <Pencil size={14} style={{ opacity: 0.5 }} />
                    ) : (
                      <Lock size={14} style={{ opacity: 0.3 }} />
                    )}
                  </div>
                </div>
              </div>

              {expandedIncidentId === incident.id && (
                <IncidentDetail 
                  incident={incident} 
                  feedback={feedback[incident.id!] || ''}
                  setFeedback={(val) => setFeedback(prev => ({ ...prev, [incident.id!]: val }))}
                  onUpdateStatus={(status) => handleStatusUpdate(incident.id!, status)}
                  isUpdating={updating === incident.id}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const IncidentDetail = ({ incident, feedback, setFeedback, onUpdateStatus, isUpdating }: any) => {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToReportsByIncident(incident.id, setReports);
    return () => unsubscribe();
  }, [incident.id]);

  const isLocked = ['resolved', 'false-alarm'].includes(incident.status);

  return (
    <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
      {/* Bulk Action UI */}
      <div style={{ 
        marginBottom: '2rem', 
        padding: '1rem', 
        background: 'var(--color-surface-hover)', 
        borderRadius: '8px',
        opacity: isLocked ? 0.7 : 1,
        pointerEvents: isLocked ? 'none' : 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.9rem' }}>
            {isLocked ? 'Closed Incident (Read Only)' : 'Update Incident Status'}
          </h4>
          {isLocked && <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Lock size={12} /> This incident is finalized
          </span>}
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input 
            className="input-field" 
            placeholder={isLocked ? "No further feedback allowed" : "Feedback for all reporters..."}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            disabled={isLocked || isUpdating}
            style={{ flex: 1, minWidth: '200px' }}
          />
          <select 
            className="input-field"
            onChange={(e) => e.target.value && onUpdateStatus(e.target.value)}
            disabled={isLocked || isUpdating}
            value={incident.status}
            style={{ width: 'auto' }}
          >
            <option value="reported">Reported</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="in-progress">In-Progress</option>
            <option value="resolved">Resolved</option>
            <option value="false-alarm">False Alarm</option>
          </select>
        </div>
      </div>

      <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>Individual Reports</h4>
      <div style={{ display: 'grid', gap: '1rem' }}>
        {reports.map(report => (
          <div key={report.id} style={{ padding: '1rem', background: 'var(--color-surface-hover)', borderRadius: '8px', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>{report.userName}</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{formatDate(report.createdAt)}</span>
            </div>
            <p style={{ fontWeight: 500, marginBottom: '0.25rem' }}>Issue: {report.issueType}</p>
            <p>{report.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
