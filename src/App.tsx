import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Sun, Moon, User as UserIcon, LogIn, ChevronRight, Zap, Shield, Bell, Menu, X } from 'lucide-react';

// Components & Pages
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import { Sidebar } from './components/Sidebar';
import { LocationSelector } from './components/LocationSelector';
import { Login } from './pages/user/Login';
import { UserDashboard } from './pages/user/Dashboard';
import { DashboardOverview } from './pages/user/DashboardOverview';
import { NewReport } from './pages/user/NewReport';
import { Schedule } from './pages/user/Schedule';
import { Notifications } from './pages/user/Notifications';
import { Profile } from './pages/user/Profile';
import { Tickets } from './pages/user/Tickets';
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminIncidents } from './pages/admin/Incidents';
import { AdminTickets } from './pages/admin/Tickets';
import { AdminLocations } from './pages/admin/Locations';
import { AdminSchedule } from './pages/admin/Schedule';
import { AdminSettings } from './pages/admin/Settings';
import { LocationRequests } from './pages/admin/LocationRequests';
import { SuperAdminUserManagement } from './pages/admin/SuperAdminUserManagement';
import { SuperAdminAdminManagement } from './pages/admin/SuperAdminAdminManagement';

const Home = () => {
  const { user, role } = useAuth();
  
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section style={{ 
        position: 'relative',
        height: '95vh',
        width: '100%',
        padding: '0 1rem',
        marginTop: '1rem'
      }}>
        <div style={{
          position: 'relative',
          height: '100%',
          width: '100%',
          borderRadius: '40px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-card)',
          background: '#000000'
        }}>
          <img 
            src="/src/assets/nairobi.jpg" 
            alt="Nairobi Skyline" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              opacity: 0.5
            }}
          />
          
          <Navbar isOverlay={true} />

          <Link 
            to={user ? (['admin', 'superadmin'].includes(role as string) ? '/admin' : '/dashboard') : '/login'}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              alignItems: 'center',
              textAlign: 'center',
              padding: '2rem 2rem 3rem 2rem',
              background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 35%)',
              textDecoration: 'none',
              cursor: 'pointer'
            }}
          >
            <h1 style={{ 
              color: 'white', 
              fontSize: 'clamp(3rem, 10vw, 6rem)', 
              fontWeight: 800,
              letterSpacing: '-2px',
              marginBottom: '1rem',
              lineHeight: 1,
              textShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
              Je, Uko na Pawa?
            </h1>
            <p style={{ 
              color: 'rgba(255,255,255,0.95)', 
              fontSize: '1.5rem', 
              maxWidth: '800px',
              fontWeight: 400,
              margin: 0
            }}>
              Real-time power outage tracking and reporting for the Juja community.
            </p>
          </Link>
        </div>
      </section>
      
      {/* Features Section */}
      <section style={{ 
        padding: '8rem 2rem', 
        maxWidth: '1100px', 
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '2rem',
          width: '100%',
          justifyContent: 'center'
        }}>
          <FeatureCard 
            icon={<Zap size={28} />}
            title="Real-time Reporting"
            desc="Instantly report outages in your area and help your community stay updated."
          />
          <FeatureCard 
            icon={<Bell size={28} />}
            title="Instant Alerts"
            desc="Get notified the moment power is restored or maintenance is scheduled."
          />
          <FeatureCard 
            icon={<Shield size={28} />}
            title="Official Tracking"
            desc="Follow official updates from technicians and track the progress of repairs."
          />
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" style={{ 
        padding: '3rem 2rem', 
        borderTop: '1px solid var(--color-border)',
        borderLeft: '1px solid var(--color-border)',
        borderRight: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        marginTop: 'auto',
        maxWidth: '1200px',
        width: '94%',
        margin: '4rem auto 0',
        borderTopLeftRadius: '40px',
        borderTopRightRadius: '40px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.05)'
      }}>
        <h2 style={{ color: 'var(--primary-color)', fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Pawaa</h2>
        <p style={{ maxWidth: '600px', fontSize: '0.95rem', opacity: 0.8, margin: 0 }}>
          The official power outage management platform for Juja residents. 
          Stay informed, stay powered.
        </p>
        
        <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', fontWeight: 500 }}>
          <Link to="/" style={{ color: 'inherit' }}>Home</Link>
          <Link to="/schedule" style={{ color: 'inherit' }}>Schedule</Link>
          <Link to="/report" style={{ color: 'inherit' }}>Report Outage</Link>
          <a href="mailto:support@pawaa.app" style={{ color: 'inherit', textDecoration: 'none' }}>Contact Support</a>
        </div>

        <div style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)', width: '100%', opacity: 0.5, fontSize: '0.8rem' }}>
          &copy; 2026 Pawaa Juja. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: any) => (
  <div className="glass-panel" style={{ 
    textAlign: 'center',
    padding: '3rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '32px',
    transition: 'transform 0.3s ease, border-color 0.3s ease',
    cursor: 'default'
  }}
  onMouseOver={(e) => {
    e.currentTarget.style.transform = 'translateY(-10px)';
    e.currentTarget.style.borderColor = 'var(--primary-color)';
  }}
  onMouseOut={(e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
  }}>
    <div style={{ 
      color: 'var(--primary-color)', 
      background: 'rgba(37, 99, 235, 0.1)', 
      width: '64px', 
      height: '64px', 
      borderRadius: '20px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      marginBottom: '1.5rem' 
    }}>
      {icon}
    </div>
    <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 700 }}>{title}</h3>
    <p style={{ fontSize: '0.95rem', lineHeight: 1.6, opacity: 0.8 }}>{desc}</p>
  </div>
);

const Navbar = ({ isOverlay = false, onToggleSidebar, sidebarOpen }: { isOverlay?: boolean, onToggleSidebar?: () => void, sidebarOpen?: boolean }) => {
  const { user, role } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <nav className="navbar" style={{ 
      position: isOverlay ? 'absolute' : (isHome ? 'relative' : 'sticky'), 
      top: isOverlay ? '1.5rem' : (isHome ? 'auto' : 0), 
      left: isOverlay ? '50%' : 'auto',
      transform: isOverlay ? 'translateX(-50%)' : 'none',
      zIndex: 200,
      margin: isOverlay ? '0' : (isHome ? '3rem auto' : '0'),
      borderRadius: (isHome || isOverlay) ? '100px' : '0',
      border: (isHome || isOverlay) ? '1px solid var(--color-border)' : 'none',
      borderBottom: '1px solid var(--color-border)',
      maxWidth: (isHome || isOverlay) ? '1200px' : 'none',
      alignSelf: 'center',
      width: (isHome || isOverlay) ? '94%' : '100%',
      boxShadow: (isHome || isOverlay) ? '0 20px 40px rgba(0,0,0,0.2)' : 'none',
      background: isOverlay ? 'rgba(0, 0, 0, 0.4)' : 'var(--color-surface)',
      backdropFilter: isOverlay ? 'blur(15px)' : 'none',
      padding: (isHome || isOverlay) ? '0.75rem 2rem' : '1rem 2rem',
      color: isOverlay ? 'white' : 'inherit'
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {user && (
          <button 
            className="hamburger-btn"
            onClick={onToggleSidebar}
            aria-label="Toggle Sidebar"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        )}
        <Link to="/" className="brand-title" style={{ 
          color: isOverlay ? 'white' : 'var(--primary-color)',
          textDecoration: 'none'
        }}>Pawaa</Link>
      </div>
      
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        {/* Menu Items - Only visible when not logged in */}
        {!user && (
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
            <Link to="/" style={{ color: 'inherit' }}>Home</Link>
            <Link to="/schedule" style={{ color: 'inherit' }}>Schedule</Link>
            <a href="#footer" style={{ color: 'inherit', textDecoration: 'none' }}>Contact Us</a>
          </div>
        )}

        {!user && <div style={{ height: '24px', width: '1px', background: isOverlay ? 'rgba(255,255,255,0.2)' : 'var(--color-border)' }}></div>}

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            aria-label="Toggle Theme"
            style={{
              background: isOverlay ? 'rgba(255,255,255,0.1)' : 'var(--color-surface-hover)',
              border: '1px solid ' + (isOverlay ? 'rgba(255,255,255,0.2)' : 'var(--color-border)'),
              color: isOverlay ? 'white' : 'var(--primary-color)',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
          >
            {theme === 'light' ? <Moon size={18} fill="currentColor" /> : <Sun size={18} />}
          </button>

          {user ? (
            <Link 
              to="/profile" 
              title="Go to Profile"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                padding: '0.4rem 0.75rem', 
                borderRadius: '12px',
                background: isOverlay ? 'rgba(255,255,255,0.15)' : 'rgba(37, 99, 235, 0.1)',
                color: isOverlay ? 'white' : 'var(--primary-color)',
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              <UserIcon size={18} />
              <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.displayName || user.email?.split('@')[0]}
              </span>
            </Link>
          ) : (
            <Link to="/login" className="btn btn-primary" style={{ 
              padding: '0.5rem 1.25rem', 
              fontSize: '0.85rem', 
              borderRadius: '10px',
              background: isOverlay ? 'white' : 'var(--primary-color)',
              color: isOverlay ? 'black' : 'white'
            }}>
              <LogIn size={16} /> Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

/** Wraps user pages with the always-visible sidebar */
const UserLayout = ({ children, sidebarOpen, onCloseSidebar }: { children: React.ReactNode, sidebarOpen: boolean, onCloseSidebar: () => void }) => (
  <div style={{ display: 'flex', flex: 1 }}>
    <Sidebar isOpen={sidebarOpen} onClose={onCloseSidebar} />
    <main className="main-content" style={{ flex: 1, minWidth: 0 }}>
      {children}
    </main>
  </div>
);

function AppInner() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isLogin = location.pathname === '/login';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-container">
      {/* On Home page, Navbar is moved below Hero inside the layout. On Login page, it is hidden. */}
      {!isHome && !isLogin && (
        <Navbar 
          onToggleSidebar={toggleSidebar} 
          sidebarOpen={sidebarOpen} 
        />
      )}
      
      {/* Mandatory location selection for logged in users */}
      <LocationSelector />

      <Routes>
        {/* Public routes - Home handles its own navbar position */}
        <Route path="/" element={
          <main style={{ display: 'flex', flexDirection: 'column' }}>
            <Home />
            {/* Navbar rendered here on Home page */}
            <div style={{ order: -1, display: 'none' }}></div> {/* Spacer for CSS order if needed */}
          </main>
        } />
        
        <Route path="/login" element={<main className="main-content"><Login /></main>} />

        {/* Protected user routes — sidebar always visible */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<UserLayout sidebarOpen={sidebarOpen} onCloseSidebar={closeSidebar}><DashboardOverview /></UserLayout>} />
          <Route path="/tickets" element={<UserLayout sidebarOpen={sidebarOpen} onCloseSidebar={closeSidebar}><Tickets /></UserLayout>} />
          <Route path="/report" element={<UserLayout sidebarOpen={sidebarOpen} onCloseSidebar={closeSidebar}><NewReport /></UserLayout>} />
          <Route path="/schedule"      element={<UserLayout sidebarOpen={sidebarOpen} onCloseSidebar={closeSidebar}><Schedule /></UserLayout>} />
          <Route path="/notifications" element={<UserLayout sidebarOpen={sidebarOpen} onCloseSidebar={closeSidebar}><Notifications /></UserLayout>} />
          <Route path="/profile"       element={<UserLayout sidebarOpen={sidebarOpen} onCloseSidebar={closeSidebar}><Profile /></UserLayout>} />
        </Route>

        {/* Admin routes - with sidebar */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<UserLayout sidebarOpen={sidebarOpen} onCloseSidebar={closeSidebar}><AdminDashboard /></UserLayout>} />
          <Route path="/admin/incidents" element={<UserLayout sidebarOpen={sidebarOpen} onCloseSidebar={closeSidebar}><AdminIncidents /></UserLayout>} />
          <Route path="/admin/tickets" element={<UserLayout sidebarOpen={sidebarOpen} onCloseSidebar={closeSidebar}><AdminTickets /></UserLayout>} />
          <Route path="/admin/locations" element={<UserLayout sidebarOpen={sidebarOpen} onCloseSidebar={closeSidebar}><AdminLocations /></UserLayout>} />
          <Route path="/admin/schedule"  element={<UserLayout sidebarOpen={sidebarOpen} onCloseSidebar={closeSidebar}><AdminSchedule /></UserLayout>} />
          <Route path="/admin/requests"  element={<UserLayout sidebarOpen={sidebarOpen} onCloseSidebar={closeSidebar}><LocationRequests /></UserLayout>} />
          <Route path="/admin/settings"  element={<UserLayout sidebarOpen={sidebarOpen} onCloseSidebar={closeSidebar}><AdminSettings /></UserLayout>} />
          <Route path="/admin/users"  element={<UserLayout sidebarOpen={sidebarOpen} onCloseSidebar={closeSidebar}><SuperAdminUserManagement /></UserLayout>} />
          <Route path="/admin/admins"  element={<UserLayout sidebarOpen={sidebarOpen} onCloseSidebar={closeSidebar}><SuperAdminAdminManagement /></UserLayout>} />
        </Route>
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}

export default App;
