import { 
  Database, Trash2, UserCheck, AlertCircle, MapPin,
  BarChart3, Calendar, Clock, AlertTriangle, TrendingUp,
  Filter, CheckCircle
} from 'lucide-react';
import { collection, getDocs, writeBatch, doc, getDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { type OutageReport, formatDate } from '../../services/db';

export const AdminSettings = () => {
  const { user } = useAuth();
  const [resetting, setResetting] = useState(false);
  const [dbAdminVerified, setDbAdminVerified] = useState<boolean | null>(null);
  const [reports, setReports] = useState<OutageReport[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    const verifyAdmin = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        setDbAdminVerified(userDoc.exists() && ['admin', 'superadmin'].includes(userDoc.data()?.role as string));
      } catch (e) {
        setDbAdminVerified(false);
      }
    };
    verifyAdmin();
  }, [user]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const reportList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as OutageReport[];
        setReports(reportList);
      } catch (error) {
        console.error('Failed to fetch reports for analytics:', error);
      } finally {
        setAnalyticsLoading(false);
      }
    };
    if (dbAdminVerified !== null) {
      fetchReports();
    }
  }, [dbAdminVerified]);

  const getFilteredReports = () => {
    const now = new Date();
    let cutoffDate: Date;
    
    if (timeRange === 'week') {
      cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return reports.filter(r => {
      const reportDate = r.createdAt?.toDate 
        ? r.createdAt.toDate() 
        : new Date(r.createdAt);
      return reportDate >= cutoffDate;
    });
  };

  const calculateAnalytics = () => {
    const filtered = getFilteredReports();
    const now = new Date();

    const locationCounts: Record<string, number> = {};
    const issueTypeCounts: Record<string, number> = {};
    let totalResponseTime = 0;
    let resolvedCount = 0;

    filtered.forEach(report => {
      locationCounts[report.location] = (locationCounts[report.location] || 0) + 1;
      issueTypeCounts[report.issueType] = (issueTypeCounts[report.issueType] || 0) + 1;

      if (report.status === 'resolved' || report.status === 'in-progress' || report.status === 'acknowledged') {
        const createdAt = report.createdAt?.toDate 
          ? report.createdAt.toDate() 
          : new Date(report.createdAt);
        
        if (report.resolvedAt) {
          const resolvedAt = report.resolvedAt?.toDate 
            ? report.resolvedAt.toDate() 
            : new Date(report.resolvedAt);
          const diffMs = resolvedAt.getTime() - createdAt.getTime();
          totalResponseTime += diffMs;
          resolvedCount++;
        }
      }
    });

    const avgResponseTime = resolvedCount > 0 
      ? Math.round(totalResponseTime / resolvedCount / (1000 * 60)) 
      : 0;

    const topLocations = Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topIssues = Object.entries(issueTypeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      totalReports: filtered.length,
      avgResponseTime,
      topLocations,
      topIssues,
      resolvedCount
    };
  };

  const handleResetDatabase = async () => {
    if (!window.confirm("CRITICAL: This will delete ALL incidents, reports, notifications, and schedules. This cannot be undone. Proceed?")) return;
    
    setResetting(true);
    try {
      const collections = ['incidents', 'reports', 'notifications', 'schedules'];
      
      for (const colName of collections) {
        const q = collection(db, colName);
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) continue;

        // Firestore batch limit is 500 operations
        let batch = writeBatch(db);
        let count = 0;
        
        for (const docSnap of snapshot.docs) {
          batch.delete(docSnap.ref);
          count++;
          
          if (count === 450) { // Commit every 450 docs to stay safe
            await batch.commit();
            batch = writeBatch(db);
            count = 0;
          }
        }
        
        if (count > 0) {
          await batch.commit();
        }
      }
      
      alert("Database has been reset to zero.");
    } catch (error: any) {
      console.error("Reset Error:", error);
      alert(`Failed to reset database: ${error.message}. Ensure you are an Admin in the Firestore 'users' collection.`);
    } finally {
      setResetting(false);
    }
  };

  const StatusInfo = ({ label, color, desc }: { label: string, color: string, desc: string }) => (
    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
      <p style={{ fontWeight: 600, color, marginBottom: '0.25rem', fontSize: '0.9rem' }}>{label}</p>
      <p style={{ fontSize: '0.75rem', opacity: 0.7, lineHeight: 1.4 }}>{desc}</p>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <h2 style={{ marginBottom: '2rem', color: 'var(--primary-color)' }}>System Settings</h2>

      <div style={{ display: 'grid', gap: '2rem' }}>
        {/* Analytics Dashboard */}
        <div className="glass-panel" style={{ opacity: dbAdminVerified === false ? 0.5 : 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <BarChart3 size={24} style={{ color: 'var(--primary-color)' }} />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Outage Analytics</h3>
                <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.25rem' }}>
                  {timeRange === 'week' ? 'Last 7 days' : 'Last 30 days'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--color-bg)', padding: '0.25rem', borderRadius: '8px' }}>
              <button 
                onClick={() => setTimeRange('week')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  background: timeRange === 'week' ? 'var(--primary-color)' : 'transparent',
                  color: timeRange === 'week' ? 'white' : 'inherit',
                  transition: 'all 0.2s'
                }}
              >
                Weekly
              </button>
              <button 
                onClick={() => setTimeRange('month')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  background: timeRange === 'month' ? 'var(--primary-color)' : 'transparent',
                  color: timeRange === 'month' ? 'white' : 'inherit',
                  transition: 'all 0.2s'
                }}
              >
                Monthly
              </button>
            </div>
          </div>

          {analyticsLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
              <div className="animate-spin" style={{ fontSize: '2rem' }}>⏳</div>
              <p style={{ marginTop: '1rem' }}>Loading analytics...</p>
            </div>
          ) : (() => {
            const analytics = calculateAnalytics();
            
            return (
              <>
                {/* Key Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                  <div style={{ 
                    background: 'rgba(37, 99, 235, 0.05)', 
                    padding: '1.25rem', 
                    borderRadius: '10px',
                    textAlign: 'center',
                    border: '1px solid rgba(37, 99, 235, 0.1)'
                  }}>
                    <AlertTriangle size={28} style={{ color: 'var(--primary-color)', margin: '0 auto 0.5rem' }} />
                    <p style={{ fontSize: '2rem', fontWeight: 800, margin: 0, lineHeight: 1 }}>{analytics.totalReports}</p>
                    <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.25rem' }}>Total Reports</p>
                  </div>
                  
                  <div style={{ 
                    background: 'rgba(16, 185, 129, 0.05)', 
                    padding: '1.25rem', 
                    borderRadius: '10px',
                    textAlign: 'center',
                    border: '1px solid rgba(16, 185, 129, 0.1)'
                  }}>
                    <CheckCircle size={28} style={{ color: '#10b981', margin: '0 auto 0.5rem' }} />
                    <p style={{ fontSize: '2rem', fontWeight: 800, margin: 0, lineHeight: 1 }}>{analytics.resolvedCount}</p>
                    <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.25rem' }}>Resolved Issues</p>
                  </div>
                  
                  <div style={{ 
                    background: 'rgba(139, 92, 246, 0.05)', 
                    padding: '1.25rem', 
                    borderRadius: '10px',
                    textAlign: 'center',
                    border: '1px solid rgba(139, 92, 246, 0.1)'
                  }}>
                    <Clock size={28} style={{ color: '#8b5cf6', margin: '0 auto 0.5rem' }} />
                    <p style={{ fontSize: '2rem', fontWeight: 800, margin: 0, lineHeight: 1 }}>
                      {analytics.avgResponseTime === 0 ? '—' : `${analytics.avgResponseTime}m`}
                    </p>
                    <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.25rem' }}>Avg Response Time</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  {/* Top Locations (Hotspots) */}
                  <div style={{ 
                    background: 'var(--color-bg)', 
                    padding: '1.25rem', 
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)'
                  }}>
                    <h4 style={{ 
                      margin: '0 0 1rem 0', 
                      fontSize: '0.95rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      color: '#f59e0b'
                    }}>
                      <MapPin size={18} />
                      Hotspot Locations
                    </h4>
                    
                    {analytics.topLocations.length === 0 ? (
                      <p style={{ opacity: 0.5, textAlign: 'center', padding: '1rem' }}>No data yet</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {analytics.topLocations.map(([location, count], idx) => {
                          const maxCount = analytics.topLocations[0][1];
                          const percentage = (count / maxCount) * 100;
                          
                          return (
                            <div key={location}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{location}</span>
                                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{count} report{count !== 1 ? 's' : ''}</span>
                              </div>
                              <div style={{ 
                                background: 'rgba(0,0,0,0.1)', 
                                height: '8px', 
                                borderRadius: '4px',
                                overflow: 'hidden'
                              }}>
                                <div style={{ 
                                  width: `${percentage}%`, 
                                  height: '100%', 
                                  background: idx === 0 ? '#ef4444' : (idx === 1 ? '#f59e0b' : 'var(--primary-color)'),
                                  borderRadius: '4px',
                                  transition: 'width 0.5s ease'
                                }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Top Issues */}
                  <div style={{ 
                    background: 'var(--color-bg)', 
                    padding: '1.25rem', 
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)'
                  }}>
                    <h4 style={{ 
                      margin: '0 0 1rem 0', 
                      fontSize: '0.95rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      color: 'var(--primary-color)'
                    }}>
                      <AlertTriangle size={18} />
                      Most Common Issues
                    </h4>
                    
                    {analytics.topIssues.length === 0 ? (
                      <p style={{ opacity: 0.5, textAlign: 'center', padding: '1rem' }}>No data yet</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {analytics.topIssues.map(([issue, count], idx) => {
                          const maxCount = analytics.topIssues[0][1];
                          const percentage = (count / maxCount) * 100;
                          
                          return (
                            <div key={issue}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{issue}</span>
                                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{count}</span>
                              </div>
                              <div style={{ 
                                background: 'rgba(0,0,0,0.1)', 
                                height: '8px', 
                                borderRadius: '4px',
                                overflow: 'hidden'
                              }}>
                                <div style={{ 
                                  width: `${percentage}%`, 
                                  height: '100%', 
                                  background: idx === 0 ? '#ef4444' : (idx === 1 ? '#f59e0b' : 'var(--primary-color)'),
                                  borderRadius: '4px',
                                  transition: 'width 0.5s ease'
                                }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        {/* Verification Card */}
        <div className="glass-panel" style={{ 
          border: dbAdminVerified === false ? '1px solid var(--color-error)' : '1px solid var(--color-border)',
          background: dbAdminVerified === false ? 'rgba(239, 68, 68, 0.05)' : 'var(--color-surface)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {dbAdminVerified === false ? (
              <AlertCircle size={24} style={{ color: 'var(--color-error)' }} />
            ) : (
              <UserCheck size={24} style={{ color: 'var(--primary-color)' }} />
            )}
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Admin Verification</h3>
              <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                UID: <span style={{ fontFamily: 'monospace' }}>{user?.uid}</span>
              </p>
              {dbAdminVerified === false && (
                <p style={{ color: 'var(--color-error)', fontSize: '0.875rem', marginTop: '0.5rem', fontWeight: 600 }}>
                  WARNING: Your account is not recognized as an Admin in the database. 
                  Database operations will be blocked.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ opacity: dbAdminVerified === false ? 0.5 : 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <Database size={24} style={{ color: 'var(--primary-color)' }} />
            <h3 style={{ margin: 0 }}>Data Management</h3>
          </div>
          <p style={{ marginBottom: '1rem' }}>Manage your system data. Use these tools to prepare the system for demo or production.</p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-outline" 
              onClick={handleResetDatabase}
              disabled={resetting || dbAdminVerified === false}
              style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
            >
              <Trash2 size={18} className={resetting ? 'animate-spin' : ''} /> 
              {resetting ? 'Resetting...' : 'Clear All Data (Reset to 0)'}
            </button>
          </div>
        </div>

        <div className="glass-panel" style={{ borderLeft: '4px solid var(--primary-color)' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>💡 Unified Status Guide</h3>
          <p style={{ fontSize: '0.875rem', marginBottom: '1rem', opacity: 0.8 }}>
            Statuses are now unified across <b>Incidents</b> and <b>Tickets</b>. 
            When an admin updates an Incident, all linked user tickets are automatically synced to the same status.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <StatusInfo label="Reported" color="var(--color-text-muted)" desc="User has submitted a report. No official action yet." />
            <StatusInfo label="Acknowledged" color="var(--primary-color)" desc="Official has seen the report and confirmed the area." />
            <StatusInfo label="In-Progress" color="var(--primary-color)" desc="Technicians are currently working on the fault." />
            <StatusInfo label="Resolved" color="var(--primary-color)" desc="Power is back! Issue is fixed for everyone." />
            <StatusInfo label="False Alarm" color="var(--color-text-muted)" desc="Investigated, but no actual outage was found." />
          </div>
        </div>

        <div className="glass-panel" style={{ borderLeft: '4px solid var(--primary-color)' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>📂 Issue Categorization</h3>
          <p style={{ fontSize: '0.875rem', marginBottom: '1rem', opacity: 0.8 }}>Reports are automatically grouped into incidents based on these categories:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
              <p style={{ fontWeight: 600, color: 'var(--primary-color)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Category 1: Power Loss</p>
              <ul style={{ fontSize: '0.8rem', opacity: 0.7, paddingLeft: '1rem' }}>
                <li>Total blackout</li>
                <li>Partial outage</li>
              </ul>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
              <p style={{ fontWeight: 600, color: 'var(--primary-color)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Category 2: Power Instability</p>
              <ul style={{ fontSize: '0.8rem', opacity: 0.7, paddingLeft: '1rem' }}>
                <li>Intermittent power</li>
                <li>Low voltage</li>
                <li>Power surge</li>
              </ul>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
              <p style={{ fontWeight: 600, color: 'var(--primary-color)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Category 3: Fault / Other</p>
              <ul style={{ fontSize: '0.8rem', opacity: 0.7, paddingLeft: '1rem' }}>
                <li>Electrical fault</li>
                <li>Other (manual specify)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
