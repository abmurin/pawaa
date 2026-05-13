import { useState, useEffect } from 'react';
import { subscribeToLocations, addSchedule, subscribeToSchedules, updateSchedule, type Location, type MaintenanceSchedule } from '../../services/db';
import { Calendar, Clock, MapPin, Send, Plus, Minus, Edit2, Check, X, Timer, ChevronRight } from 'lucide-react';
import { CustomDateTimePicker } from '../../components/CustomDateTimePicker';

const CountdownTimer = ({ targetDate, label = 'Starts in' }: { targetDate: string, label?: string }) => {
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
      fontSize: '0.75rem', 
      fontWeight: 600,
      color: 'var(--primary-color)',
      background: 'rgba(37, 99, 235, 0.05)',
      padding: '0.3rem 0.6rem',
      borderRadius: '6px',
      border: '1px solid rgba(37, 99, 235, 0.1)'
    }}>
      <Timer size={12} />
      <span>{label}: {timeLeft}</span>
    </div>
  );
};

export const AdminSchedule = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<MaintenanceSchedule>>({});

  const [formData, setFormData] = useState({
    locations: [] as string[],
    startTime: '',
    endTime: '',
    description: ''
  });
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);

  const toggleLocation = (locName: string) => {
    if (formData.locations.includes(locName)) {
      setFormData(prev => ({
        ...prev,
        locations: prev.locations.filter(l => l !== locName)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        locations: [...prev.locations, locName]
      }));
    }
  };

  const selectAllLocations = () => {
    setFormData(prev => ({
      ...prev,
      locations: locations.map(l => l.name)
    }));
  };

  const clearAllLocations = () => {
    setFormData(prev => ({
      ...prev,
      locations: []
    }));
  };

  useEffect(() => {
    subscribeToLocations(setLocations);
    subscribeToSchedules(setSchedules);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.locations.length === 0 || !formData.startTime || !formData.endTime) {
      alert("Please select at least one location.");
      return;
    }

    setLoading(true);
    try {
      await addSchedule(formData);
      setFormData({ locations: [], startTime: '', endTime: '', description: '' });
      alert(`Maintenance scheduled for ${formData.locations.length} location(s)!`);
    } catch (error) {
      console.error(error);
      alert("Failed to schedule maintenance.");
    } finally {
      setLoading(false);
    }
  };

  const handleExtend = async (scheduleId: string, currentEndTime: string) => {
    const newEndTime = new Date(new Date(currentEndTime).getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);
    try {
      await updateSchedule(scheduleId, { endTime: newEndTime });
    } catch (error) {
      console.error("Failed to extend schedule:", error);
    }
  };

  const handleReduce = async (scheduleId: string, currentEndTime: string) => {
    const newEndTime = new Date(new Date(currentEndTime).getTime() - 60 * 60 * 1000).toISOString().slice(0, 16);
    try {
      await updateSchedule(scheduleId, { endTime: newEndTime });
    } catch (error) {
      console.error("Failed to reduce schedule:", error);
    }
  };

  return (
    <div className="animate-fade-in">
      <h2 style={{ marginBottom: '2rem', color: 'var(--primary-color)' }}>Maintenance Scheduling</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', alignItems: 'start' }}>
        {/* Schedule Form */}
        <div className="glass-panel">
          <h3 style={{ marginBottom: '1.5rem' }}>Plan New Maintenance</h3>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Target Locations</label>
              <div 
                className="input-field" 
                style={{ 
                  padding: '0.75rem 1rem', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  minHeight: '48px'
                }}
                onClick={() => setLocationPickerOpen(!locationPickerOpen)}
              >
                <span style={{ 
                  opacity: formData.locations.length === 0 ? 0.5 : 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  flex: 1
                }}>
                  {formData.locations.length === 0 
                    ? "Select locations..." 
                    : (formData.locations.length > 2 
                        ? `${formData.locations.slice(0, 2).join(', ')} +${formData.locations.length - 2} more` 
                        : formData.locations.join(', ')
                      )
                  }
                </span>
                {formData.locations.length > 0 && (
                  <span style={{ 
                    background: 'var(--primary-color)', 
                    color: 'white', 
                    fontSize: '0.7rem', 
                    fontWeight: 700, 
                    padding: '0.1rem 0.5rem', 
                    borderRadius: '999px',
                    marginLeft: '0.5rem'
                  }}>
                    {formData.locations.length}
                  </span>
                )}
                <ChevronRight 
                  size={16} 
                  style={{ 
                    transform: locationPickerOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                    marginLeft: '0.5rem',
                    opacity: 0.5
                  }} 
                />
              </div>

              {locationPickerOpen && (
                <div style={{ 
                  background: 'var(--color-surface)', 
                  border: '1px solid var(--color-border)', 
                  borderRadius: '8px', 
                  marginTop: '0.5rem',
                  padding: '1rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  zIndex: 10
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '0.75rem',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid var(--color-border)'
                  }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Choose Locations</span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        type="button" 
                        className="btn btn-outline" 
                        style={{ fontSize: '0.7rem', padding: '0.25rem 0.75rem' }}
                        onClick={(e) => { e.stopPropagation(); selectAllLocations(); }}
                      >
                        Select All
                      </button>
                      <button 
                        type="button" 
                        className="btn" 
                        style={{ fontSize: '0.7rem', padding: '0.25rem 0.75rem', background: 'rgba(0,0,0,0.05)' }}
                        onClick={(e) => { e.stopPropagation(); clearAllLocations(); }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
                    gap: '0.5rem',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    marginBottom: '0.75rem'
                  }}>
                    {locations.map(loc => (
                      <label 
                        key={loc.id} 
                        onClick={(e) => e.stopPropagation()}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.5rem', 
                          padding: '0.5rem 0.75rem', 
                          borderRadius: '6px',
                          cursor: 'pointer',
                          background: formData.locations.includes(loc.name) 
                            ? 'rgba(37, 99, 235, 0.1)' 
                            : 'transparent',
                          transition: 'all 0.2s'
                        }}
                      >
                        <input 
                          type="checkbox"
                          checked={formData.locations.includes(loc.name)}
                          onChange={() => toggleLocation(loc.name)}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{loc.name}</span>
                      </label>
                    ))}
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--color-border)'
                  }}>
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      onClick={(e) => { e.stopPropagation(); setLocationPickerOpen(false); }}
                      style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem' }}
                    >
                      OK
                    </button>
                  </div>
                </div>
              )}
            </div>

            <CustomDateTimePicker 
              label="Start Time"
              value={formData.startTime}
              onChange={(val) => setFormData({...formData, startTime: val})}
            />

            <CustomDateTimePicker 
              label="Expected End Time"
              value={formData.endTime}
              onChange={(val) => setFormData({...formData, endTime: val})}
            />

            <div className="input-group">
              <label className="input-label">Description / Reason</label>
              <textarea 
                className="input-field" 
                rows={3}
                placeholder="e.g. Transformer upgrade in Gachororo"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                required
              />
            </div>

            <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
              {loading ? 'Scheduling...' : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                  <Check size={18} /> OK - Schedule & Notify
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Existing Schedules */}
        <div className="glass-panel">
          <h3 style={{ marginBottom: '1.5rem' }}>Active & Upcoming Maintenance</h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {schedules.length === 0 ? (
              <p style={{ textAlign: 'center', opacity: 0.5, padding: '2rem' }}>No maintenance scheduled.</p>
            ) : (
              schedules.map(s => {
                const now = new Date();
                const startTime = new Date(s.startTime);
                const endTime = new Date(s.endTime);
                const isPast = now > endTime;
                const isUpcoming = now < startTime;
                const isOngoing = now >= startTime && now <= endTime;
                
                // Handle both single location (legacy) and multiple locations
                const displayLocations = Array.isArray(s.locations) ? s.locations : (s.location ? [s.location] : []);
                
                return (
                  <div key={s.id} style={{ 
                    padding: '1.25rem', 
                    background: 'var(--color-bg)', 
                    borderRadius: '10px',
                    opacity: isPast ? 0.6 : 1,
                    borderLeft: `4px solid ${isPast ? 'var(--color-text-muted)' : (isOngoing ? '#d97706' : 'var(--primary-color)')}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isPast ? 'inherit' : 'var(--primary-color)' }}>
                        <MapPin size={16} />
                        <span style={{ fontWeight: 600 }}>
                          {displayLocations.length > 2 
                            ? `${displayLocations.slice(0, 2).join(', ')} +${displayLocations.length - 2} more` 
                            : displayLocations.join(', ')
                          }
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {isOngoing && <CountdownTimer targetDate={s.endTime} label="Ends in" />}
                        {isUpcoming && <CountdownTimer targetDate={s.startTime} label="Starts in" />}
                        {isPast && (
                          <span style={{ color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.75rem' }}>DONE</span>
                        )}
                      </div>
                    </div>
                    
                    <p style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>{s.description}</p>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: isPast ? 'inherit' : 'var(--primary-color)', display: 'flex', gap: '1rem' }}>
                        <span>Starts: {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>Ends: {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      
                      {!isPast && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            onClick={() => handleReduce(s.id!, s.endTime)}
                            title="Reduce by 1 hour"
                            className="btn" 
                            style={{ padding: '0.25rem', minWidth: '32px', height: '32px', background: 'rgba(0,0,0,0.05)' }}
                          >
                            <Minus size={14} />
                          </button>
                          <button 
                            onClick={() => handleExtend(s.id!, s.endTime)}
                            title="Extend by 1 hour"
                            className="btn" 
                            style={{ padding: '0.25rem', minWidth: '32px', height: '32px', background: 'rgba(0,0,0,0.05)' }}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      )}
                    </div>
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
