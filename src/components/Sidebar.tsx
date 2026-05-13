import { NavLink, useNavigate } from 'react-router-dom';
import { 
  FileText, Zap, Calendar, Bell, User, LayoutDashboard, 
  MapPin, Settings, AlertTriangle, ClipboardList, LogOut,
  Users, Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { logoutUser } from '../services/firebase';

const userNavItems = [
  { to: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard'     },
  { to: '/tickets',        icon: FileText,        label: 'My Tickets'    },
  { to: '/schedule',       icon: Calendar,        label: 'Schedule'      },
  { to: '/notifications',  icon: Bell,            label: 'Notifications', hasBadge: true },
  { to: '/profile',        icon: User,            label: 'My Profile'    },
];

const adminNavItems = [
  { to: '/admin',            icon: LayoutDashboard, label: 'Admin Dashboard' },
  { to: '/admin/incidents',  icon: AlertTriangle,   label: 'Incidents',       hasBadge: 'incidents' },
  { to: '/admin/tickets',    icon: ClipboardList,   label: 'All Tickets'     },
  { to: '/admin/locations',  icon: MapPin,          label: 'Locations'       },
  { to: '/admin/schedule',   icon: Calendar,        label: 'Maintenance'     },
  { to: '/admin/requests',   icon: User,            label: 'User Requests',   hasBadge: 'requests' },
  { to: '/admin/settings',   icon: Settings,        label: 'Settings'        },
];

const superAdminNavItems = [
  { to: '/admin',            icon: LayoutDashboard, label: 'Admin Dashboard' },
  { to: '/admin/incidents',  icon: AlertTriangle,   label: 'Incidents',       hasBadge: 'incidents' },
  { to: '/admin/tickets',    icon: ClipboardList,   label: 'All Tickets'     },
  { to: '/admin/locations',  icon: MapPin,          label: 'Locations'       },
  { to: '/admin/schedule',   icon: Calendar,        label: 'Maintenance'     },
  { to: '/admin/requests',   icon: User,            label: 'User Requests',   hasBadge: 'requests' },
  { to: '/admin/settings',   icon: Settings,        label: 'Settings'        },
  { to: '/admin/users',      icon: Users,           label: 'User Mgt'        },
  { to: '/admin/admins',     icon: Shield,          label: 'Admin Mgt'       },
];

export const Sidebar = ({ isOpen, onClose }: { isOpen?: boolean, onClose?: () => void }) => {
  const { 
    role, 
    unreadNotifications, 
    pendingIncidents, 
    pendingLocationRequests 
  } = useAuth();
  const navigate = useNavigate();
  let navItems;
  if (role === 'superadmin') {
    navItems = superAdminNavItems;
  } else if (role === 'admin') {
    navItems = adminNavItems;
  } else {
    navItems = userNavItems;
  }

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      await logoutUser();
      navigate('/');
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 998,
          display: isOpen ? 'block' : 'none',
          transition: 'opacity 0.3s ease',
        }}
        className="mobile-only"
      />

      <aside
        style={{
          width: '240px',
          flexShrink: 0,
          minHeight: 'calc(100vh - 70px)',
          background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          paddingTop: '1.5rem',
          position: 'sticky',
          top: '70px',
          alignSelf: 'flex-start',
          height: 'calc(100vh - 70px)',
          overflowY: 'auto',
          zIndex: 999,
          transition: 'transform 0.3s ease',
        }}
        className={`sidebar ${isOpen ? 'open' : ''}`}
      >
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0 0.75rem', flex: 1 }}>
          <div style={{ padding: '0 1rem 1rem 1rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem 0' }}>
              {role === 'admin' ? 'Administration' : 'Member Services'}
            </p>
          </div>
          {navItems.map(({ to, icon: Icon, label, hasBadge }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin' || to === '/dashboard'}
              onClick={onClose}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                whiteSpace: 'nowrap',
                color: isActive ? 'var(--primary-color)' : 'var(--color-text-muted)',
                background: isActive ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: '0.9rem',
                transition: 'all 0.2s',
                textDecoration: 'none',
                position: 'relative'
              })}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} />
                {((hasBadge === true && unreadNotifications > 0) || 
                  (hasBadge === 'incidents' && pendingIncidents > 0) || 
                  (hasBadge === 'requests' && pendingLocationRequests > 0)) && (
                  <span style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-12px',
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '999px',
                    minWidth: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                    border: '2px solid var(--color-surface)',
                    zIndex: 1
                  }}>
                    {(() => {
                      let count = 0;
                      if (hasBadge === true) count = unreadNotifications;
                      if (hasBadge === 'incidents') count = pendingIncidents;
                      if (hasBadge === 'requests') count = pendingLocationRequests;
                      return count > 99 ? '99+' : count;
                    })()}
                  </span>
                )}
              </div>
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid var(--color-border)' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: 'var(--color-error)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};
