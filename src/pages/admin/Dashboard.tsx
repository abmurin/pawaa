import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  subscribeToAllReports, 
  subscribeToSchedules, 
  subscribeToUsers,
  subscribeToLocations,
  type OutageReport, 
  type MaintenanceSchedule, 
  formatDate 
} from '../../services/db';
import { 
  Users, FileText, AlertTriangle, CheckCircle, 
  ShieldAlert, BarChart3, Construction, CalendarDays,
  Activity, Zap, MapPinned, TrendingUp, UserPlus, Globe
} from 'lucide-react';

export const AdminDashboard = () => {
  const [reports, setReports] = useState<OutageReport[]>([]);
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubReports = subscribeToAllReports((fetchedReports) => {
      setReports(fetchedReports);
    });
    
    const unsubSchedules = subscribeToSchedules((fetchedSchedules) => {
      setSchedules(fetchedSchedules);
    });

    const unsubUsers = subscribeToUsers((fetchedUsers) => {
      setUsers(fetchedUsers);
    });

    const unsubLocs = subscribeToLocations((fetchedLocs) => {
      setLocations(fetchedLocs);
    });

    const timer = setTimeout(() => setLoading(false), 500);
    return () => {
      unsubReports();
      unsubSchedules();
      unsubUsers();
      unsubLocs();
      clearTimeout(timer);
    };
  }, []);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const stats = {
    total: reports.length,
    active: reports.filter(r => ['reported', 'acknowledged', 'in-progress'].includes(r.status)).length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    falseAlarms: reports.filter(r => r.status === 'false-alarm').length,
    today: reports.filter(r => {
      const d = new Date(r.createdAt?.toDate ? r.createdAt.toDate() : r.createdAt);
      return d >= todayStart;
    }).length,
    ongoingMaintenance: schedules.filter(s => {
      const start = new Date(s.startTime);
      const end = new Date(s.endTime);
      return now >= start && now <= end;
    }).length,
    totalUsers: users.length,
    totalLocations: locations.length
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Activity className="animate-pulse" size={48} style={{ color: 'var(--primary-color)', opacity: 0.2 }} />
        <p style={{ marginTop: '1rem', opacity: 0.5 }}>Analyzing system analytics...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--primary-color)', marginBottom: '0.25rem' }}>System Overview</h2>
        <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>Global tracking and incident management</p>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '1.25rem', 
        marginBottom: '3rem' 
      }}>
        <StatCard 
          label="Total Reports" 
          value={stats.total} 
          icon={FileText} 
          color="var(--primary-color)" 
          bg="rgba(37, 99, 235, 0.1)"
          subtext="Total filed in system"
        />
        <StatCard 
          label="Active Incidents" 
          value={stats.active} 
          icon={AlertTriangle} 
          color="#f59e0b" 
          bg="rgba(245, 158, 11, 0.1)"
          subtext="Currently being handled"
        />
        <StatCard 
          label="Total Resolved" 
          value={stats.resolved} 
          icon={CheckCircle} 
          color="#10b981" 
          bg="rgba(16, 185, 129, 0.1)"
          subtext="Issues successfully fixed"
        />
        <StatCard 
          label="False Alarms" 
          value={stats.falseAlarms} 
          icon={ShieldAlert} 
          color="#ef4444" 
          bg="rgba(239, 68, 68, 0.1)"
          subtext="Invalid reports flagged"
        />
        <StatCard 
          label="Filed Today" 
          value={stats.today} 
          icon={TrendingUp} 
          color="#8b5cf6" 
          bg="rgba(139, 92, 246, 0.1)"
          subtext="New reports since midnight"
        />
        <StatCard 
          label="Live Maintenance" 
          value={stats.ongoingMaintenance} 
          icon={Construction} 
          color="#06b6d4" 
          bg="rgba(6, 182, 212, 0.1)"
          subtext="Active across all areas"
        />
        <StatCard 
          label="Total Users" 
          value={stats.totalUsers} 
          icon={UserPlus} 
          color="#ec4899" 
          bg="rgba(236, 72, 153, 0.1)"
          subtext="Registered community members"
        />
        <StatCard 
          label="Locations" 
          value={stats.totalLocations} 
          icon={Globe} 
          color="#6366f1" 
          bg="rgba(99, 102, 241, 0.1)"
          subtext="Areas currently covered"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Recent System Activity</h3>
            <Link to="/admin/incidents" style={{ fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: 600 }}>View All</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reports.slice(0, 5).map(report => (
              <div key={report.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '1rem', 
                background: 'rgba(255,255,255,0.02)', 
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
                borderLeft: `4px solid ${getStatusColor(report.status)}`
              }}>
                <div>
                  <p style={{ fontWeight: 700, color: 'var(--color-text-main)', margin: '0 0 0.25rem 0' }}>{report.location}</p>
                  <p style={{ fontSize: '0.75rem', opacity: 0.7, margin: 0 }}>{report.issueType}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`status-badge status-${report.status}`} style={{ fontSize: '0.65rem' }}>{report.status.replace('-', ' ')}</span>
                  <p style={{ fontSize: '0.7rem', marginTop: '0.4rem', opacity: 0.5 }}>{formatDate(report.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Upcoming Maintenance</h3>
            <Link to="/admin/schedule" style={{ fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: 600 }}>View Schedule</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {schedules.length === 0 ? (
              <p style={{ opacity: 0.5, textAlign: 'center', padding: '2rem' }}>No maintenance scheduled.</p>
            ) : (
              schedules.slice(0, 5).map(s => {
                const isOngoing = now >= new Date(s.startTime) && now <= new Date(s.endTime);
                // Handle both single location (legacy) and multiple locations
                const displayLocations = Array.isArray(s.locations) ? s.locations : (s.location ? [s.location] : []);
                return (
                  <div key={s.id} style={{ 
                    padding: '1rem', 
                    background: isOngoing ? 'rgba(6, 182, 212, 0.05)' : 'rgba(255,255,255,0.02)', 
                    borderRadius: '12px',
                    border: isOngoing ? '1px solid rgba(6, 182, 212, 0.2)' : '1px solid var(--color-border)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ fontWeight: 700, margin: 0 }}>
                        {displayLocations.length > 2 
                          ? `${displayLocations.slice(0, 2).join(', ')} +${displayLocations.length - 2} more` 
                          : displayLocations.join(', ')
                        }
                      </p>
                      {isOngoing && <span style={{ fontSize: '0.6rem', color: '#06b6d4', fontWeight: 800 }}>LIVE</span>}
                    </div>
                    <p style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.4rem' }}>
                      {new Date(s.startTime).toLocaleDateString()} at {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color, bg, subtext }: any) => (
  <div className="glass-panel" style={{ 
    display: 'flex', 
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '0.75rem',
    padding: '1.5rem',
    minHeight: '160px'
  }}>
    <div style={{ 
      background: bg, 
      width: '44px',
      height: '44px',
      borderRadius: '12px',
      color: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }}>
      <Icon size={22} />
    </div>
    <div>
      <p style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.25rem 0', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>{label}</p>
      {subtext && <p style={{ fontSize: '0.65rem', marginTop: '0.25rem', opacity: 0.5 }}>{subtext}</p>}
    </div>
  </div>
);

const getStatusColor = (status: string) => {
  switch (status) {
    case 'reported': return '#64748b';
    case 'acknowledged': return 'var(--primary-color)';
    case 'in-progress': return 'var(--primary-color)';
    case 'resolved': return '#10b981';
    case 'false-alarm': return '#ef4444';
    default: return '#64748b';
  }
};
