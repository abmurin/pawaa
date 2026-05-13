import { useState, useEffect } from 'react';
import { getLocations, type Location } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { MapPin, Check } from 'lucide-react';

export const LocationSelector = () => {
  const { user, role, location, updateUserLocation } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getLocations().then(setLocations).catch(console.error);
  }, []);

  // If no user, or already have location, or is admin/superadmin - don't show at all!
  if (!user || location || role === 'admin' || role === 'superadmin') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation || !user) return;
    
    setLoading(true);
    try {
      await updateUserLocation(selectedLocation);
    } catch (error) {
      console.error("Failed to set location:", error);
      alert("Failed to set location. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div className="glass-panel animate-scale-in" style={{ 
        maxWidth: '450px', 
        width: '100%', 
        padding: '2.5rem',
        textAlign: 'center'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: 'rgba(37, 99, 235, 0.1)',
          color: 'var(--primary-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem'
        }}>
          <MapPin size={32} />
        </div>

        <h2 style={{ marginBottom: '0.5rem' }}>Welcome to Pawaa!</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
          To provide accurate reporting and notifications, please select your primary residence in Juja.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="location">Residential Area</label>
            <select 
              id="location"
              className="input-field" 
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              required
              disabled={loading}
              style={{ textAlign: 'center' }}
            >
              <option value="" disabled>Choose your location</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.name} style={{ background: 'var(--color-bg)' }}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={!selectedLocation || loading}
          >
            {loading ? 'Setting location...' : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <Check size={18} /> Confirm Location
              </span>
            )}
          </button>
          
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '1.5rem' }}>
            Note: You can only report outages for this location. Changes require admin approval.
          </p>
        </form>
      </div>
    </div>
  );
};
