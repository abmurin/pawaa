import { useState, useEffect } from 'react';
import { subscribeToAllUsers, type SystemUser, updateUserRole, createUserAccount, deleteUser } from '../../services/db';
import { resetPassword } from '../../services/firebase';
import { User, Shield, Key, Edit2, Plus, X, Trash2, Copy, Check, Settings } from 'lucide-react';

export const SuperAdminUserManagement = () => {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [showCredentials, setShowCredentials] = useState<{ name: string; email: string; password: string } | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<'user' | 'admin' | 'superadmin'>('user');

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      if (field === 'all') {
        setShowCopiedToast(true);
        setTimeout(() => setShowCopiedToast(false), 2000);
      }
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeToAllUsers((usersData) => {
      console.log("SuperAdminUserManagement: Received users:", usersData);
      setUsers(usersData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter(u => {
    const matches = u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    u.role?.toLowerCase().includes(searchTerm.toLowerCase());
    return matches && u.role === 'user';
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

  const handleUpdateRole = async (userId: string, newRole: 'user' | 'admin' | 'superadmin') => {
    setUpdatingId(userId);
    try {
      await updateUserRole(userId, newRole);
      alert("User role updated successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to update user role.");
    } finally {
      setUpdatingId(null);
      setEditingUserId(null);
    }
  };

  const handleDeleteUser = async (userItem: SystemUser) => {
    const confirmMessage = `Are you sure you want to delete ${userItem.name || userItem.email}? This will remove them from the system.`;
    if (!confirm(confirmMessage)) return;
    setDeletingId(userItem.id!);
    try {
      await deleteUser(userItem.id!);
      alert("User deleted successfully! Note: To delete from Firebase Auth, use Firebase Console.");
    } catch (error) {
      console.error(error);
      alert("Failed to delete user.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserPassword) return;
    
    setCreating(true);
    try {
      await createUserAccount(newUserEmail, newUserPassword, 'user', newUserName);
      setShowCredentials({
        name: newUserName || 'User',
        email: newUserEmail,
        password: newUserPassword
      });
      setNewUserEmail('');
      setNewUserName('');
      setNewUserPassword('');
      setShowCreateForm(false);
    } catch (error) {
      console.error(error);
      alert("Failed to create user account.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <h2 style={{ marginBottom: '2rem', color: 'var(--primary-color)' }}>User Management</h2>

      {/* Credentials Modal */}
      {showCredentials && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{ 
            maxWidth: '500px', 
            width: '100%', 
            padding: '2rem',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto'
              }}>
                <Check size={32} style={{ color: '#10b981' }} />
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>User Created Successfully!</h3>
              <p style={{ margin: 0, opacity: 0.7, fontSize: '0.9rem' }}>Share these credentials with the user</p>
            </div>
            
            <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{
                background: 'var(--color-bg)',
                padding: '1rem',
                borderRadius: '10px',
                border: '1px solid var(--color-border)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', opacity: 0.6, margin: '0 0 0.25rem 0' }}>Name</p>
                    <p style={{ margin: 0, fontWeight: 600 }}>{showCredentials.name}</p>
                  </div>
                  <button
                    className="btn btn-outline"
                    onClick={() => copyToClipboard(showCredentials.name, 'name')}
                    style={{ padding: '0.5rem', fontSize: '0.8rem' }}
                  >
                    {copiedField === 'name' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
              
              <div style={{
                background: 'var(--color-bg)',
                padding: '1rem',
                borderRadius: '10px',
                border: '1px solid var(--color-border)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', opacity: 0.6, margin: '0 0 0.25rem 0' }}>Email</p>
                    <p style={{ margin: 0, fontWeight: 600 }}>{showCredentials.email}</p>
                  </div>
                  <button
                    className="btn btn-outline"
                    onClick={() => copyToClipboard(showCredentials.email, 'email')}
                    style={{ padding: '0.5rem', fontSize: '0.8rem' }}
                  >
                    {copiedField === 'email' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
              
              <div style={{
                background: 'var(--color-bg)',
                padding: '1rem',
                borderRadius: '10px',
                border: '1px solid var(--color-border)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', opacity: 0.6, margin: '0 0 0.25rem 0' }}>Password</p>
                    <p style={{ margin: 0, fontWeight: 600, fontFamily: 'monospace' }}>{showCredentials.password}</p>
                  </div>
                  <button
                    className="btn btn-outline"
                    onClick={() => copyToClipboard(showCredentials.password, 'password')}
                    style={{ padding: '0.5rem', fontSize: '0.8rem' }}
                  >
                    {copiedField === 'password' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="btn btn-outline"
                onClick={() => setShowCredentials(null)}
                style={{ flex: 1 }}
              >
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const message = `Login Credentials for Pawaa:\nName: ${showCredentials.name}\nEmail: ${showCredentials.email}\nPassword: ${showCredentials.password}`;
                  copyToClipboard(message, 'all');
                }}
                style={{ flex: 1 }}
              >
                <Copy size={18} />
                Copy All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copied Toast */}
      {showCopiedToast && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#10b981',
          color: 'white',
          padding: '1rem 2rem',
          borderRadius: '10px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <Check size={20} />
          Copied!
        </div>
      )}

      <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: showCreateForm ? '1rem' : 0 }}>
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
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            <Plus size={18} />
            {showCreateForm ? 'Cancel' : 'Add User'}
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreateUser} style={{
            padding: '1.5rem',
            background: 'var(--color-bg)',
            borderRadius: '10px',
            border: '1px solid var(--color-border)'
          }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem' }}>Create New User</h4>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.25rem', display: 'block' }}>Name</label>
                <input
                  className="input-field"
                  type="text"
                  placeholder="Full name"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                />
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.25rem', display: 'block' }}>Email</label>
                <input
                  className="input-field"
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                />
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.25rem', display: 'block' }}>Password</label>
                <input
                  className="input-field"
                  type="password"
                  required
                  placeholder="Set a password"
                  value={newUserPassword}
                  onChange={e => setNewUserPassword(e.target.value)}
                  minLength={6}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  type="submit"
                  className="btn"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create User'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewUserEmail('');
                    setNewUserName('');
                    setNewUserPassword('');
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
                <tr key={userItem.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-surface-hover)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
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
                        <p style={{ fontWeight: 600, margin: 0 }}>{userItem.name || userItem.email || 'Unknown User'}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <p style={{ fontSize: '0.75rem', opacity: 0.6, margin: 0 }}>{userItem.email || 'ID: ' + userItem.id}</p>
                          {userItem.email && (
                            <button
                              onClick={() => copyToClipboard(userItem.email, `email-${userItem.id}`)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0.25rem',
                                display: 'flex',
                                alignItems: 'center',
                                color: 'var(--color-text-muted)'
                              }}
                            >
                              {copiedField === `email-${userItem.id}` ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                          )}
                        </div>
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
                      
                      {editingUserId === userItem.id ? (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as 'user' | 'admin' | 'superadmin')}
                            style={{
                              padding: '0.5rem 0.75rem',
                              borderRadius: '6px',
                              border: '1px solid var(--color-border)',
                              background: 'var(--color-surface)',
                              color: 'inherit',
                              fontSize: '0.8rem'
                            }}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            <option value="superadmin">Super Admin</option>
                          </select>
                          <button
                            className="btn"
                            onClick={() => handleUpdateRole(userItem.id!, editRole)}
                            disabled={updatingId === userItem.id}
                            style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                          >
                            {updatingId === userItem.id ? 'Updating...' : 'Save'}
                          </button>
                          <button
                            className="btn btn-outline"
                            onClick={() => setEditingUserId(null)}
                            style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-outline"
                          onClick={() => {
                            setEditingUserId(userItem.id!);
                            setEditRole(userItem.role);
                          }}
                          style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                        >
                          <Settings size={16} />
                          Edit Role
                        </button>
                      )}
                      
                      <button
                        className="btn btn-outline"
                        onClick={() => handleDeleteUser(userItem)}
                        disabled={deletingId === userItem.id}
                        style={{ 
                          padding: '0.5rem 0.75rem', 
                          fontSize: '0.8rem',
                          borderColor: 'var(--color-error)',
                          color: 'var(--color-error)'
                        }}
                      >
                        <Trash2 size={16} />
                        {deletingId === userItem.id ? 'Deleting...' : 'Delete'}
                      </button>
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