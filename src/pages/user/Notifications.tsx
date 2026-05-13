import { useState, useEffect } from 'react';
import { Bell, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { subscribeToUserNotifications, markNotificationsRead, type Notification } from '../../services/db';

export const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToUserNotifications(user.uid, (data) => {
      setNotifications(data);
      setLoading(false);
    });
    // Mark notifications as read when page loads
    markNotificationsRead(user.uid).catch(console.error);
    return () => unsubscribe();
  }, [user]);

  if (loading) return <div className="app-container" style={{justifyContent: 'center', alignItems: 'center'}}>Loading notifications...</div>;

  return (
    <div className="animate-fade-in">
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Bell size={24} /> My Notifications
      </h2>
      
      {notifications.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
          <Bell size={48} style={{ color: 'var(--primary-color)', marginBottom: '1rem', opacity: 0.3 }} />
          <p>No notifications yet. You'll receive updates about your reports here.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {notifications.map((notif) => (
            <div key={notif.id} className="glass-panel" style={{ 
              display: 'flex', 
              gap: '1.5rem', 
              alignItems: 'start',
              borderLeft: `4px solid ${notif.read ? 'transparent' : 'var(--primary-color)'}`,
              opacity: notif.read ? 0.7 : 1
            }}>
              <div style={{ 
                background: 'rgba(37, 99, 235, 0.05)', 
                padding: '0.75rem', 
                borderRadius: '10px' 
              }}>
                {getIcon(notif.title)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{notif.title}</h3>
                  <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                    {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleString() : 'Just now'}
                  </span>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-main)' }}>{notif.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const getIcon = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes('status')) return <CheckCircle size={20} style={{ color: 'var(--primary-color)' }} />;
  if (t.includes('maintenance')) return <AlertTriangle size={20} style={{ color: 'var(--primary-color)' }} />;
  return <Info size={20} style={{ color: 'var(--primary-color)' }} />;
};

