import { useState, useEffect } from 'react';
import { 
  collection, query, where, onSnapshot, doc, updateDoc 
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { MapPin, Check, X, User, Activity, AlertCircle, ArrowRight } from 'lucide-react';

export const LocationRequests = () => {
  const [changeRequests, setChangeRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to location change requests
    const q = query(collection(db, 'users'), where('locationChangeRequested', '==', true));
    const unsub = onSnapshot(q, (snapshot) => {
      setChangeRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => {
      console.error("LocationRequests: Error fetching requests:", err);
      setChangeRequests([]);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleApproveLocation = async (userId: string, requestedLocation: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        location: requestedLocation,
        locationChangeRequested: false,
        requestedNewLocation: null,
        locationChangeReason: null
      });
      alert("Location change approved!");
    } catch (error) {
      console.error("Failed to approve location change:", error);
      alert("Failed to approve request. Check permissions!");
    }
  };

  const handleRejectLocation = async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        locationChangeRequested: false,
        requestedNewLocation: null,
        locationChangeReason: null
      });
      alert("Request rejected.");
    } catch (error) {
      console.error("Failed to reject location change:", error);
      alert("Failed to reject request. Check permissions!");
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Activity className="animate-pulse" size={48} style={{ color: 'var(--primary-color)', opacity: 0.2 }} />
        <p style={{ marginTop: '1rem', opacity: 0.5 }}>Loading requests...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ color: 'var(--primary-color)', marginBottom: '0.25rem' }}>Location Change Requests</h2>
        <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>Manage user requests to update their residential area</p>
      </div>

      {changeRequests.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '20px', 
            background: 'rgba(37, 99, 235, 0.05)', 
            color: 'var(--primary-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <MapPin size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>All Caught Up!</h3>
          <p style={{ opacity: 0.6, maxWidth: '400px', margin: '0 auto' }}>No pending location change requests from community members at this time.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {changeRequests.map(req => (
            <div key={req.id} className="glass-panel" style={{ 
              padding: '1.5rem', 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderLeft: '4px solid var(--primary-color)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '8px', 
                    background: 'rgba(37, 99, 235, 0.1)', 
                    color: 'var(--primary-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <User size={16} />
                  </div>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '1rem', display: 'block' }}>{req.email}</span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>UID: {req.id}</span>
                  </div>
                </div>
                
                <div style={{ marginLeft: '2.75rem' }}>
                  <p style={{ fontSize: '0.9rem', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 600, opacity: 0.9 }}>Reason:</span> {req.locationChangeReason || 'No reason provided'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', background: 'rgba(0,0,0,0.03)', padding: '0.3rem 0.75rem', borderRadius: '6px' }}>
                      <MapPin size={12} />
                      <span>Current: <strong>{req.location || 'Not set'}</strong></span>
                    </div>
                    {req.requestedNewLocation && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', background: 'rgba(37,99,235,0.1)', padding: '0.3rem 0.75rem', borderRadius: '6px', color: 'var(--primary-color)' }}>
                        <ArrowRight size={12} />
                        <span>Requested: <strong>{req.requestedNewLocation}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={() => handleRejectLocation(req.id)}
                  className="btn" 
                  style={{ 
                    padding: '0.75rem', 
                    minWidth: '48px', 
                    background: 'rgba(239, 68, 68, 0.1)', 
                    color: '#ef4444', 
                    border: '1px solid rgba(239, 68, 68, 0.2)' 
                  }}
                  title="Reject Request"
                >
                  <X size={20} />
                </button>
                <button 
                  onClick={() => req.requestedNewLocation && handleApproveLocation(req.id, req.requestedNewLocation)}
                  className="btn btn-primary" 
                  style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  disabled={!req.requestedNewLocation}
                >
                  <Check size={20} /> Approve Change
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
