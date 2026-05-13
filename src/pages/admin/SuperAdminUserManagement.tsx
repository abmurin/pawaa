import { useState, useEffect } from 'react';
import { subscribeToAllUsers, type SystemUser, updateUserRole } from '../../services/db';
import { resetPassword } from '../../services/firebase';
import { User, Shield, Key, Edit2 } from 'lucide-react';

export const SuperAdminUserManagement = () => {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAllUsers((usersData) => {
      setUsers(usersData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter(u => {
    const matches = u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.role.toLowerCase().includes(searchTerm.toLowerCase());
    return matches && u.role !== 'superadmin';
  });

  const handleResetPassword = async (email: string) => {
    if (!email) return;
    if (!confirm(`Send password reset email to ${email}?`)) return;
    
    try {
      await resetPassword(email);
      alert(`Password reset email sent to ${email}!`);
    } catch (error) {
      console.error(error);
      alert("Failed to send password reset email.");
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'user' | 'admin') => {
    setUpdatingId(userId);
    try {
      await updateUserRole(userId, newRole);
      alert("User role updated successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to update user role.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="animate-fade-in">
      <h2 style={{ marginBottom: '2rem', color: 'var(--primary-color)' }}>User Management</h2>

      <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
            <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
            <input
              className="input-field"
              placeholder="Search users by email or role..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '3rem' }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="animate-spin" style={{ fontSize: '2rem' }}>⏳</div>
          <p style={{ marginTop: '1rem' }}>Loading users...</p>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-hover)' }}>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>User</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Role</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((userItem) => (
                <tr key={userItem.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '50%', 
                        background: 'rgba(37, 99, 235, 0.1)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center'
                      }}>
                        <User size={20} style={{ color: 'var(--primary-color)' }} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, margin: 0 }}>{userItem.email || 'Unknown Email'}</p>
                        <p style={{ fontSize: '0.75rem', opacity: 0.6, margin: 0 }}>ID: {userItem.id}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span className="status-badge" style={{
                      background: userItem.role === 'admin' 
                        ? 'rgba(37, 99, 235, 0.1)' 
                        : 'rgba(107, 114, 128, 0.1)',
                      color: userItem.role === 'admin' 
                        ? 'var(--primary-color)' 
                        : 'var(--color-text-muted)'
                    }}>
                      {userItem.role}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-outline"
                        onClick={() => handleResetPassword(userItem.email!)}
                        disabled={!userItem.email}
                        style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                      >
                        <Key size={16} />
                        Reset Password
                      </button>
                      {userItem.role !== 'admin' ? (
                        <button
                          className="btn"
                          onClick={() => handleUpdateRole(userItem.id!, 'admin')}
                          disabled={updatingId === userItem.id}
                          style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                        >
                          <Shield size={16} />
                          {updatingId === userItem.id ? 'Updating...' : 'Make Admin'}
                        </button>
                      ) : (
                        <button
                          className="btn btn-outline"
                          onClick={() => handleUpdateRole(userItem.id!, 'user')}
                          disabled={updatingId === userItem.id}
                          style={{ 
                            padding: '0.5rem 0.75rem', 
                            fontSize: '0.8rem',
                            borderColor: 'var(--color-text-muted)',
                            color: 'var(--color-text-muted)'
                          }}
                        >
                          <Edit2 size={16} />
                          {updatingId === userItem.id ? 'Updating...' : 'Remove Admin'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>
              No users found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};