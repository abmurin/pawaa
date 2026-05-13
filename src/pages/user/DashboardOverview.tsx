import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  subscribeToUserReports, 
  subscribeToReportsByLocation, 
  subscribeToSchedules,
  type OutageReport, 
  type MaintenanceSchedule,
  formatDate 
} from '../../services/db';
import { 
  Clock, CheckCircle, AlertCircle, ShieldAlert, 
  BarChart3, Construction, CalendarDays, Zap, 
  Activity, MapPinned, Info
} from 'lucide-react';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  bg: string;
  subtext?: string;
}

const StatCard = ({ icon, label, value, color, bg, subtext }: StatCardProps) => (
  <div
    className="glass-panel"
    style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '1.5rem',
      textAlign: 'center',
      minHeight: '160px',
      transition: 'transform 0.2s ease',
      cursor: 'default'
    }}
    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
  >
    <div
      style={{
        width: '48px',
        height: '48px',
        borderRadius: '14px',
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
      }}
    >
      {icon}
    </div>
    <div style={{ width: '100%' }}>
      <p style={{ fontSize: '1.75rem', fontWeight: 800, color, lineHeight: 1, margin: '0 0 0.25rem 0' }}>{value}</p>
      <p style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', opacity: 0.9 }}>{label}</p>
      {subtext && <p style={{ fontSize: '0.65rem', opacity: 0.6, margin: 0 }}>{subtext}</p>}
    </div>
  </div>
);

export const DashboardOverview = () => {
  const { user, location: userLocation } = useAuth();
  const [userReports, setUserReports] = useState<OutageReport[]>([]);
  const [areaReports, setAreaReports] = useState<OutageReport[]>([]);
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const unsubUser = subscribeToUserReports(user.uid, (r) => {
      setUserReports(r);
    });

    const unsubSchedules = subscribeToSchedules((s) => {
      setSchedules(s);
    });

    let unsubArea = () => {};
    if (userLocation) {
      unsubArea = subscribeToReportsByLocation(userLocation, (r) => {
        setAreaReports(r);
      });
    }

    // Small delay to ensure initial snapshots are processed
    const timer = setTimeout(() => setLoading(false), 500);
    
    return () => {
      unsubUser();
      unsubArea();
      unsubSchedules();
      clearTimeout(timer);
    };
  }, [user, userLocation]);

  // Personal Stats
  const userActive = userReports.filter(r => ['reported', 'acknowledged', 'in-progress'].includes(r.status)).length;
  const userResolved = userReports.filter(r => r.status === 'resolved').length;
  const userFalseAlarms = userReports.filter(r => r.status === 'false-alarm').length;

  // Area Stats
  const areaActive = areaReports.filter(r => ['reported', 'acknowledged', 'in-progress'].includes(r.status)).length;
  const areaResolved = areaReports.filter(r => r.status === 'resolved').length;
  
  // Maintenance Stats
  const now = new Date();
  const upcomingMaintenance = schedules.filter(s => {
    if (s.location !== userLocation) return false;
    const end = new Date(s.endTime);
    const start = new Date(s.startTime);
    // Include ongoing OR upcoming in next 7 days
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return end >= now && start <= nextWeek;
  });

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ color: 'var(--primary-color)', marginBottom: '0.25rem' }}>Personal Dashboard</h2>
          <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>Real-time insights for {userLocation || 'Juja resident'}</p>
        </div>
        <Link to="/report" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}>
          Report New Outage
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <Activity className="animate-pulse" size={48} style={{ color: 'var(--primary-color)', opacity: 0.2 }} />
          <p style={{ marginTop: '1rem', opacity: 0.5 }}>Loading your dashboard data...</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '1.25rem', 
          marginBottom: '2.5rem' 
        }}>
          {/* Row 1: Your Activity */}
          <StatCard
            icon={<AlertCircle size={22} />}
            label="Your Active Reports"
            value={userActive}
            color="var(--primary-color)"
            bg="rgba(37, 99, 235, 0.1)"
            subtext="Issues currently under review"
          />
          
          <StatCard
            icon={<CheckCircle size={22} />}
            label="Your Fixed Issues"
            value={userResolved}
            color="#10b981"
            bg="rgba(16, 185, 129, 0.1)"
            subtext="Reports successfully resolved"
          />

          <StatCard
            icon={<ShieldAlert size={22} />}
            label="False Alarms"
            value={userFalseAlarms}
            color="#ef4444"
            bg="rgba(239, 68, 68, 0.1)"
            subtext="Reports marked as invalid"
          />

          {/* Row 2: Area Insights */}
          <StatCard
            icon={<Activity size={22} />}
            label={`Active in ${userLocation}`}
            value={areaActive}
            color="#f59e0b"
            bg="rgba(245, 158, 11, 0.1)"
            subtext="Total area issues ongoing"
          />

          <StatCard
            icon={<MapPinned size={22} />}
            label={`${userLocation} Fixed`}
            value={areaResolved}
            color="#8b5cf6"
            bg="rgba(139, 92, 246, 0.1)"
            subtext="Total resolved in your area"
          />

          <StatCard
            icon={<Construction size={22} />}
            label="Area Maintenance"
            value={upcomingMaintenance.length}
            color="#06b6d4"
            bg="rgba(6, 182, 212, 0.1)"
            subtext="Ongoing or scheduled soon"
          />
        </div>
      )}

      {/* Maintenance Summary */}
      <div className="glass-panel" style={{ marginBottom: '2.5rem', borderLeft: '4px solid #06b6d4' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <Construction size={20} style={{ color: '#06b6d4' }} />
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Maintenance for {userLocation}</h3>
        </div>
        
        {upcomingMaintenance.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: 0.6 }}>
            <Info size={16} />
            <p style={{ fontSize: '0.9rem', margin: 0 }}>No maintenance scheduled for your area this week.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {upcomingMaintenance.map(s => {
              const isOngoing = now >= new Date(s.startTime) && now <= new Date(s.endTime);
              return (
                <div key={s.id} style={{ 
                  background: isOngoing ? 'rgba(6, 182, 212, 0.05)' : 'rgba(255,255,255,0.02)', 
                  padding: '1rem', 
                  borderRadius: '16px',
                  border: isOngoing ? '1px solid rgba(6, 182, 212, 0.2)' : '1px solid var(--color-border)',
                  flex: '1 1 250px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <p style={{ fontWeight: 700, margin: 0 }}>{isOngoing ? 'Currently Ongoing' : 'Upcoming'}</p>
                    {isOngoing && <span className="status-badge" style={{ background: '#06b6d4', color: 'white', fontSize: '0.6rem' }}>LIVE</span>}
                  </div>
                  <p style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '0.5rem' }}>{s.description}</p>
                  <p style={{ fontSize: '0.75rem', opacity: 0.6, margin: 0 }}>
                    {new Date(s.startTime).toLocaleDateString()} at {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
          <Link to="/schedule" style={{ fontSize: '0.85rem', color: '#06b6d4', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Open Maintenance Calendar <BarChart3 size={14} />
          </Link>
        </div>
      </div>

      {/* Recent Personal Activity */}
      <div className="glass-panel">
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Your Recent Activity</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {userReports.length === 0 ? (
            <p style={{ opacity: 0.5, textAlign: 'center', padding: '2rem' }}>You haven't reported any outages yet.</p>
          ) : (
            userReports.slice(0, 5).map(report => (
              <div key={report.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '1rem', 
                background: 'rgba(255,255,255,0.02)', 
                borderRadius: '12px',
                border: '1px solid var(--color-border)'
              }}>
                <div>
                  <p style={{ fontWeight: 600, margin: '0 0 0.25rem 0' }}>{report.issueType}</p>
                  <p style={{ fontSize: '0.75rem', opacity: 0.6, margin: 0 }}>{formatDate(report.createdAt)}</p>
                </div>
                <span className={`status-badge status-${report.status}`} style={{ fontSize: '0.7rem' }}>
                  {report.status.replace('-', ' ')}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
