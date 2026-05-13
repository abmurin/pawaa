import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Timer, CheckCircle2, AlertTriangle } from 'lucide-react';
import { subscribeToSchedules, type MaintenanceSchedule, formatDate } from '../../services/db';

const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference <= 0) return '00:00:00';

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    setTimeLeft(calculateTimeLeft());
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '0.5rem', 
      fontSize: '0.8rem', 
      fontWeight: 600,
      color: 'var(--primary-color)',
      background: 'rgba(37, 99, 235, 0.05)',
      padding: '0.4rem 0.75rem',
      borderRadius: '8px',
      border: '1px solid rgba(37, 99, 235, 0.1)'
    }}>
      <Timer size={14} />
      <span>Starts in: {timeLeft}</span>
    </div>
  );
};

export const Schedule = () => {
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000); // Update every minute for status checks
    const unsubscribe = subscribeToSchedules((data) => {
      setSchedules(data);
      setLoading(false);
    });
    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  if (loading) return <div className="app-container" style={{justifyContent: 'center', alignItems: 'center'}}>Loading schedule...</div>;

  return (
    <div className="animate-fade-in">
      <h2 style={{ marginBottom: '2.5rem', color: 'var(--primary-color)' }}>Scheduled Maintenance</h2>
      
      {schedules.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem' }}>
          <Calendar size={48} style={{ color: 'var(--primary-color)', marginBottom: '1rem', opacity: 0.3 }} />
          <p style={{ fontSize: '1.1rem', opacity: 0.8 }}>No planned maintenance windows at the moment.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {schedules.map((item) => {
            const startTime = new Date(item.startTime);
            const endTime = new Date(item.endTime);
            const isPast = now > endTime;
            const isOngoing = now >= startTime && now <= endTime;
            const isUpcoming = now < startTime;
            
            // Handle both single location (legacy) and multiple locations
            const displayLocations = Array.isArray(item.locations) ? item.locations : (item.location ? [item.location] : []);
            
            // Check if it's the day of maintenance (for the specific "Under Maintenance" badge)
            const isMaintenanceDay = now.toDateString() === startTime.toDateString();

            return (
              <div key={item.id} className="glass-panel" style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '1rem',
                borderLeft: `4px solid ${isPast ? 'var(--color-text-muted)' : (isOngoing || isMaintenanceDay ? '#d97706' : 'var(--primary-color)')}`,
                opacity: isPast ? 0.6 : 1,
                transition: 'all 0.3s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--color-text-main)' }}>
                    {displayLocations.length > 2 
                      ? `${displayLocations.slice(0, 2).join(', ')} +${displayLocations.length - 2} more` 
                      : displayLocations.join(', ')
                    }
                  </h3>
                  {isPast ? (
                    <span className="status-badge" style={{ background: 'rgba(0, 0, 0, 0.05)', color: 'var(--color-text-muted)' }}>
                      <CheckCircle2 size={12} style={{ marginRight: '4px' }} /> DONE
                    </span>
                  ) : isMaintenanceDay ? (
                    <span className="status-badge" style={{ background: 'rgba(217, 119, 6, 0.1)', color: '#d97706' }}>
                      <AlertTriangle size={12} style={{ marginRight: '4px' }} /> UNDER MAINTENANCE
                    </span>
                  ) : (
                    <span className="status-badge" style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary-color)' }}>
                      PLANNED
                    </span>
                  )}
                </div>

                {isUpcoming && !isMaintenanceDay && <CountdownTimer targetDate={item.startTime} />}

                <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: 0.8 }}>
                    <Clock size={16} style={{ color: isPast ? 'var(--color-text-muted)' : 'var(--primary-color)' }} />
                    <span>
                      {startTime.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} — 
                      {endTime.toLocaleString([], { timeStyle: 'short' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', opacity: 0.8 }}>
                    <MapPin size={16} style={{ color: isPast ? 'var(--color-text-muted)' : 'var(--primary-color)', marginTop: '2px' }} />
                    <span>Scheduled Maintenance: {displayLocations.join(', ')}</span>
                  </div>
                </div>

                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.03)', 
                  padding: '1rem', 
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  border: '1px solid var(--color-border)'
                }}>
                  {item.description}
                </div>

                <div style={{ fontSize: '0.75rem', opacity: 0.4, marginTop: 'auto', textAlign: 'right' }}>
                  Posted {formatDate(item.createdAt)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
