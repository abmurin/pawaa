import { useState, useEffect } from 'react';
import { subscribeToLocations, addLocation, type Location } from '../../services/db';
import { MapPin, Plus, Trash2 } from 'lucide-react';

export const AdminLocations = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [newLocation, setNewLocation] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToLocations(setLocations);
    return () => unsubscribe();
  }, []);

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocation.trim()) return;
    
    setLoading(true);
    try {
      console.log("Attempting to add location:", newLocation.trim());
      await addLocation(newLocation.trim());
      setNewLocation('');
      alert("Location added successfully!");
    } catch (error: any) {
      console.error("Error adding location:", error);
      alert(`Failed to add location: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <h2 style={{ marginBottom: '2rem', color: 'var(--primary-color)' }}>Manage Service Locations</h2>

      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Add New Location</h3>
        <form onSubmit={handleAddLocation} style={{ display: 'flex', gap: '1rem' }}>
          <input 
            className="input-field" 
            placeholder="e.g. Juja South Estate"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" disabled={loading}>
            <Plus size={18} /> Add Location
          </button>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
        {locations.length === 0 ? (
          <div className="glass-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
            No locations found. They should be seeded automatically on login.
          </div>
        ) : (
          locations.map(loc => (
            <div key={loc.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'rgba(37, 99, 235, 0.1)', padding: '0.75rem', borderRadius: '10px', color: 'var(--primary-color)' }}>
                  <MapPin size={20} />
                </div>
                <div>
                  <p style={{ fontWeight: 600, margin: 0 }}>{loc.name}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
