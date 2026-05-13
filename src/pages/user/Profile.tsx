import { User, Mail, Shield, Fingerprint, Calendar, MapPin, RefreshCw, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

export const Profile = () => {
  const { user, role, location, locationChangeRequested, requestLocationChange } = useAuth();
  const [reason, setReason] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    
    setSubmitting(true);
    try {
      await requestLocationChange(reason);
      setShowRequestModal(false);
      setReason('');
      alert("Request submitted successfully. An admin will review it.");
    } catch (error) {
      console.error("Failed to submit request:", error);
      alert("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <User size={28} /> Account Profile
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Manage your personal information and account security.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* Profile Card */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2.5rem' }}>
          <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                style={{ width: '100px', height: '100px', borderRadius: '50%', border: '3px solid var(--primary-color)', padding: '3px' }}
              />
            ) : (
              <div style={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '50%', 
                background: 'rgba(37, 99, 235, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--primary-color)',
                border: '1px solid var(--color-border)'
              }}>
                <User size={48} />
              </div>
            )}
            <div style={{ 
              position: 'absolute', 
              bottom: 0, 
              right: 0, 
              background: 'var(--primary-color)', 
              color: 'white', 
              padding: '0.4rem', 
              borderRadius: '50%',
              display: 'flex',
              border: '2px solid var(--color-bg)'
            }}>
              <Shield size={14} />
            </div>
          </div>
          
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{user?.displayName || user?.email?.split('@')[0]}</h3>
          <p className="status-badge" style={{ 
            background: 'rgba(37, 99, 235, 0.1)', 
            color: 'var(--primary-color)',
            fontSize: '0.7rem',
            padding: '0.2rem 0.75rem',
            marginBottom: '1.5rem'
          }}>
            {role?.toUpperCase()} ACCOUNT
          </p>

          <div style={{ 
            width: '100%', 
            padding: '1.25rem', 
            background: 'rgba(37, 99, 235, 0.05)', 
            borderRadius: '16px',
            border: '1px solid rgba(37, 99, 235, 0.1)',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <MapPin size={18} style={{ color: 'var(--primary-color)' }} />
              <span style={{ fontWeight: 600 }}>Current Location</span>
            </div>
            <p style={{ fontSize: '1.1rem', margin: '0 0 1rem 2.25rem' }}>{location || 'Not set'}</p>
            
            {locationChangeRequested ? (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                color: '#d97706', 
                fontSize: '0.8rem',
                background: 'rgba(217, 119, 6, 0.1)',
                padding: '0.5rem 0.75rem',
                borderRadius: '8px'
              }}>
                <Clock size={14} /> Request pending approval
              </div>
            ) : (
              <button 
                onClick={() => setShowRequestModal(true)}
                className="btn btn-primary" 
                style={{ 
                  width: '100%', 
                  fontSize: '0.8rem', 
                  padding: '0.6rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: 'var(--primary-color)',
                  color: 'white',
                  border: 'none'
                }}
              >
                <RefreshCw size={14} /> Request Change
              </button>
            )}
          </div>
        </div>

        {/* Details Card */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Fingerprint size={18} style={{ color: 'var(--primary-color)' }} /> Personal Details
          </h3>
          
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <InfoItem 
              icon={<Mail size={16} />} 
              label="Email Address" 
              value={user?.email || 'N/A'} 
            />
            <InfoItem 
              icon={<User size={16} />} 
              label="Full Name" 
              value={user?.displayName || 'Not provided'} 
            />
            <InfoItem 
              icon={<Shield size={16} />} 
              label="System Role" 
              value={role || 'User'} 
              isCapitalize 
            />
            <InfoItem 
              icon={<Fingerprint size={16} />} 
              label="Unique User ID" 
              value={user?.uid || '—'} 
              isMonospace
            />
          </div>
        </div>
      </div>

      {/* Change Request Modal */}
      {showRequestModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="glass-panel animate-scale-in" style={{ maxWidth: '400px', width: '100%', padding: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Request Location Change</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              Please provide a reason for changing your location (e.g., "I moved to Gachororo"). An admin will review your request.
            </p>
            
            <form onSubmit={handleRequest}>
              <div className="input-group">
                <label className="input-label">Reason for change</label>
                <textarea 
                  className="input-field"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason here..."
                  required
                  rows={3}
                  style={{ resize: 'none' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowRequestModal(false)}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                  disabled={submitting}
                >
                  {submitting ? 'Sending...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoItem = ({ icon, label, value, isCapitalize, isMonospace }: any) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
    <div style={{ 
      width: '32px', 
      height: '32px', 
      borderRadius: '8px', 
      background: 'rgba(37, 99, 235, 0.05)', 
      color: 'var(--primary-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {icon}
    </div>
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>{label}</p>
      <p style={{ 
        fontSize: '0.95rem', 
        fontWeight: 500, 
        margin: 0,
        textTransform: isCapitalize ? 'capitalize' : 'none',
        fontFamily: isMonospace ? 'monospace' : 'inherit',
        wordBreak: 'break-all'
      }}>
        {value}
      </p>
    </div>
  </div>
);
