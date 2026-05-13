import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createReport, getLocations, checkActiveMaintenance, type Location, type IssueType } from '../../services/db';
import { useAuth } from '../../context/AuthContext';


export const NewReport = () => {
  const { user, location: userLocation } = useAuth();
  const navigate = useNavigate();
  
  const [issueType, setIssueType] = useState<IssueType | ''>('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [maintenance, setMaintenance] = useState<any>(null);

  useEffect(() => {
    if (userLocation) {
      checkActiveMaintenance(userLocation).then(setMaintenance);
    }
  }, [userLocation]);

  const issueTypes: IssueType[] = [
    'Total blackout',
    'Partial outage',
    'Intermittent power',
    'Low voltage',
    'Power surge',
    'Electrical fault',
    'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userLocation || !issueType) return;
    
    setLoading(true);
    try {
      await createReport({
        uid: user.uid,
        userName: user.displayName || user.email || 'Anonymous',
        location: userLocation,
        issueType: issueType as IssueType,
        description: issueType === 'Other' ? description : issueType,
        status: 'reported',
        createdAt: new Date()
      });
      navigate('/dashboard');
    } catch (error) {
      console.error("Failed to submit report:", error);
      alert("Failed to submit report.");
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center' }}>
      <div className="glass-panel" style={{ maxWidth: '500px', width: '100%' }}>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>Report Power Outage</h2>
        
        <div style={{ 
          background: maintenance ? 'rgba(217, 119, 6, 0.05)' : 'rgba(37, 99, 235, 0.05)', 
          padding: '1rem', 
          borderRadius: '12px', 
          marginBottom: '1.5rem',
          border: maintenance ? '1px solid rgba(217, 119, 6, 0.1)' : '1px solid rgba(37, 99, 235, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{ color: maintenance ? '#d97706' : 'var(--primary-color)' }}>
            {maintenance ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            )}
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', opacity: 0.6, margin: 0 }}>Reporting for location:</p>
            <p style={{ fontWeight: 600, margin: 0 }}>{userLocation || 'No location set'}</p>
          </div>
        </div>

        {maintenance ? (
          <div className="animate-fade-in" style={{ 
            textAlign: 'center', 
            padding: '1.5rem', 
            background: 'rgba(217, 119, 6, 0.1)', 
            borderRadius: '16px',
            color: '#d97706',
            marginBottom: '1.5rem',
            border: '1px solid rgba(217, 119, 6, 0.2)'
          }}>
            <p style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '1.1rem' }}>Maintenance Scheduled for Today</p>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
              Reporting is disabled for <strong>{userLocation}</strong> today due to planned maintenance. 
              Please check the schedule page for more details.
            </p>
            <Link to="/schedule" className="btn btn-primary" style={{ 
              marginTop: '1rem', 
              background: '#d97706', 
              borderColor: '#d97706',
              fontSize: '0.8rem',
              padding: '0.5rem 1rem'
            }}>
              View Schedule
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="issueType">Type of Issue</label>
            <select 
              id="issueType"
              className="input-field" 
              value={issueType}
              onChange={(e) => setIssueType(e.target.value as IssueType)}
              required
            >
              <option value="" disabled>Select Issue Type</option>
              {issueTypes.map(type => (
                <option key={type} value={type} style={{ background: 'var(--color-bg)' }}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          
          {issueType === 'Other' && (
            <div className="input-group animate-fade-in">
              <label className="input-label" htmlFor="description">Specify the issue</label>
              <textarea 
                id="description"
                className="input-field" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the electrical fault or other issue..."
                required
                rows={3}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
            <Link to="/dashboard" className="btn btn-outline" style={{ flex: 1 }}>
              Cancel
            </Link>
          </div>
        </form>
      )}
    </div>
  </div>
);
};
