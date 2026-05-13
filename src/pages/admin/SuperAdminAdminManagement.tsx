import { useState, useEffect } from 'react';
import { subscribeToAllUsers, type SystemUser, updateUserRole, createUserAccount, deleteUser } from '../../services/db';
import { resetPassword } from '../../services/firebase';
import { User, Shield, Key, XCircle, Plus, X, Trash2 } from 'lucide-react';

export const SuperAdminAdminManagement = () => {
  const [admins, setAdmins] = useState<SystemUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAllUsers((usersData) => {
      setAdmins(usersData.filter(u => u.role === 'admin'));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredAdmins = admins.filter(a => 
    a.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleRemoveAdmin = async (userId: string) => {
    if (!confirm("Are you sure you want to remove admin privileges from this user?")) return;
    setUpdatingId(userId);
    try {
      await updateUserRole(userId, 'user');
      alert("Admin privileges removed!");
    } catch (error) {
      console.error(error);
      alert("Failed to remove admin privileges.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteAdmin = async (userId: string) => {
    if (!confirm("WARNING: This will delete this admin from the system. Do you want to continue?")) return;
    setDeletingId(userId);
    try {
      await deleteUser(userId);
      alert("Admin deleted successfully! Note: To delete from Firebase Auth, use Firebase Console.");
    } catch (error) {
      console.error(error);
      alert("Failed to delete admin.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail || !newAdminPassword) return;
    
    setCreating(true);
    try {
      await createUserAccount(newAdminEmail, newAdminPassword, 'admin', newAdminName);
      alert("Admin account created successfully!");
      setNewAdminEmail('');
      setNewAdminName('');
      setNewAdminPassword('');
      setShowCreateForm(false);
    } catch (error) {
      console.error(error);
      alert("Failed to create admin account.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <h2 style={{ marginBottom: '2rem', color: 'var(--primary-color)' }}>Admin Management</h2>

      <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: showCreateForm ? '1rem' : 0 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
            <Shield size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
            <input
              className="input-field"
              placeholder="Search admins by email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '3rem' }}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            <Plus size={18} />
            {showCreateForm ? 'Cancel' : 'Add Admin'}
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreateAdmin} style={{
            padding: '1.5rem',
            background: 'var(--color-bg)',
            borderRadius: '10px',
            border: '1px solid var(--color-border)'
          }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem' }}>Create New Admin</h4>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.25rem', display: 'block' }}>Name</label>
                <input
                  className="input-field"
                  type="text"
                  placeholder="Full name"
                  value={newAdminName}
                  onChange={e => setNewAdminName(e.target.value)}
                />
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.25rem', display: 'block' }}>Email</label>
                <input
                  className="input-field"
                  type="email"
                  required
                  placeholder="admin@example.com"
                  value={newAdminEmail}
                  onChange={e => setNewAdminEmail(e.target.value)}
                />
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.25rem', display: 'block' }}>Password</label>
                <input
                  className="input-field"
                  type="password"
                  required
                  placeholder="Set a password"
                  value={newAdminPassword}
                  onChange={e => setNewAdminPassword(e.target.value)}
                  minLength={6}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  type="submit"
                  className="btn"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create Admin'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewAdminEmail('');
                    setNewAdminName('');
                    setNewAdminPassword('');
                  }}
                  style={{ marginLeft: '0.5rem' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {loading ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="animate-spin" style={{ fontSize: '2rem' }}>⏳</div>
          <p style={{ marginTop: '1rem' }}>Loading admins...</p>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-hover)' }}>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Admin</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Role</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.map((adminItem) => (
                <tr key={adminItem.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
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
                        <p style={{ fontWeight: 600, margin: 0 }}>{adminItem.name || adminItem.email || 'Unknown Admin'}</p>
                        <p style={{ fontSize: '0.75rem', opacity: 0.6, margin: 0 }}>{adminItem.email || 'ID: ' + adminItem.id}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span className="status-badge" style={{
                      background: 'rgba(37, 99, 235, 0.1)',
                      color: 'var(--primary-color)'
                    }}>
                      Admin
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-outline"
                        onClick={() => handleResetPassword(adminItem.email!)}
                        disabled={!adminItem.email}
                        style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                      >
                        <Key size={16} />
                        Reset Password
                      </button>
                      <button
                        className="btn btn-outline"
                        onClick={() => handleRemoveAdmin(adminItem.id!)}
                        disabled={updatingId === adminItem.id}
                        style={{ 
                          padding: '0.5rem 0.75rem', 
                          fontSize: '0.8rem',
                          borderColor: 'var(--color-text-muted)',
                          color: 'var(--color-text-muted)'
                        }}
                      >
                        <XCircle size={16} />
                        {updatingId === adminItem.id ? 'Removing...' : 'Remove Admin'}
                      </button>
                      <button
                        className="btn btn-outline"
                        onClick={() => handleDeleteAdmin(adminItem.id!)}
                        disabled={deletingId === adminItem.id}
                        style={{ 
                          padding: '0.5rem 0.75rem', 
                          fontSize: '0.8rem',
                          borderColor: 'var(--color-error)',
                          color: 'var(--color-error)'
                        }}
                      >
                        <Trash2 size={16} />
                        {deletingId === adminItem.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredAdmins.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>
              No admins found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};