import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { subscribeToUserReports, type OutageReport, formatDate } from '../../services/db';
import { Link } from 'react-router-dom';

export const UserDashboard = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<OutageReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToUserReports(user.uid, (fetchedReports) => {
      setReports(fetchedReports);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error(err);
      setError(err.message || 'Failed to load reports');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  if (loading) return <div className="app-container" style={{justifyContent: 'center', alignItems: 'center'}}>Loading reports...</div>;
  
  if (error) return (
    <div className="app-container" style={{justifyContent: 'center', alignItems: 'center'}}>
      <div className="glass-panel" style={{ borderColor: 'var(--color-error)' }}>
        <h3 style={{ color: 'var(--color-error)', marginBottom: '1rem' }}>Database Error</h3>
        <p>{error}</p>
        <p style={{ marginTop: '1rem', fontSize: '0.875rem' }}>Check your browser console for specific Firestore indexing links.</p>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--primary-color)' }}>My Outage Reports</h2>
        <Link to="/report" className="btn btn-primary">Report New Outage</Link>
      </div>

      {reports.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>You haven't reported any power outages yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {reports.map((report) => (
            <div key={report.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ marginBottom: '0.25rem' }}>{report.location}</h3>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-color)', marginBottom: '0.25rem' }}>
                  {report.issueType}
                </p>
                <p style={{ fontSize: '0.875rem' }}>{report.description}</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.7 }}>
                  {formatDate(report.createdAt)}
                </p>
              </div>
              <div>
                <span className={`status-badge status-${report.status}`}>
                  {report.status.replace('-', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
