import { useNavigate, Link } from 'react-router-dom';
import { loginWithGoogle, loginWithEmail, registerWithEmail } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';
import { ArrowLeft, Zap, Calendar, Bell, ShieldCheck } from 'lucide-react';

export const Login = () => {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    // Redirect once user and role are available
    if (user && role && !loading) {
      if (role === 'admin') navigate('/admin');
      else navigate('/dashboard');
    }
  }, [user, role, loading, navigate]);

  const handleGoogleLogin = async () => {
    try {
      setAuthLoading(true);
      await loginWithGoogle();
    } catch (error) {
      console.error("Login failed:", error);
      alert("Failed to sign in with Google.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setAuthLoading(true);
      if (isRegistering) {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (error: any) {
      console.error("Auth failed:", error);
      alert(error.message || "Authentication failed. Please check your credentials.");
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading && user) {
    return <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>Loading your profile...</div>;
  }

  return (
    <div className="app-container" style={{ 
      justifyContent: 'center', 
      alignItems: 'center', 
      padding: '2rem',
      background: 'radial-gradient(circle at top right, rgba(37, 99, 235, 0.05) 0%, transparent 40%)'
    }}>
      <div className="glass-panel" style={{ 
        maxWidth: '1000px', 
        width: '100%', 
        padding: 0, 
        overflow: 'hidden', 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        border: '1px solid var(--color-border)',
        minHeight: '600px'
      }}>
        {/* Left Column: Welcome Info */}
        <div style={{ 
          padding: '3rem', 
          background: 'rgba(37, 99, 235, 0.03)', 
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative'
        }}>
          <Link 
            to="/" 
            style={{ 
              position: 'absolute', 
              top: '2rem', 
              left: '3rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              color: 'var(--color-text-muted)', 
              textDecoration: 'none',
              fontSize: '0.875rem',
              transition: 'color 0.2s',
              fontWeight: 500
            }}
            onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary-color)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>

          <div style={{ marginTop: '2rem' }}>
            <h1 style={{ color: 'var(--primary-color)', fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>Pawaa</h1>
            <p style={{ fontSize: '1.1rem', lineHeight: 1.6, opacity: 0.8, marginBottom: '2.5rem' }}>
              Join the Juja community in reporting and tracking power outages for a more reliable future.
            </p>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <InfoFeature 
                icon={<Zap size={20} />} 
                title="Quick Reporting" 
                desc="Report an outage in seconds and notify your neighbors." 
              />
              <InfoFeature 
                icon={<Calendar size={20} />} 
                title="Maintenance Schedules" 
                desc="Stay ahead of planned maintenance in your specific area." 
              />
              <InfoFeature 
                icon={<Bell size={20} />} 
                title="Live Notifications" 
                desc="Get real-time updates when technicians resolve issues." 
              />
              <InfoFeature 
                icon={<ShieldCheck size={20} />} 
                title="Secure Access" 
                desc="Your data is protected and used only for service improvements." 
              />
            </div>
          </div>
        </div>

        {/* Right Column: Auth Form */}
        <div style={{ padding: '3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Tabs */}
          <div style={{ 
            display: 'flex', 
            background: 'rgba(255,255,255,0.03)', 
            padding: '0.4rem', 
            borderRadius: '14px', 
            marginBottom: '2.5rem',
            border: '1px solid var(--color-border)'
          }}>
            <button 
              onClick={() => setIsRegistering(false)}
              style={{ 
                flex: 1, 
                padding: '0.75rem', 
                borderRadius: '10px', 
                border: 'none',
                background: !isRegistering ? 'var(--primary-color)' : 'transparent',
                color: !isRegistering ? 'white' : 'var(--color-text-muted)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Sign In
            </button>
            <button 
              onClick={() => setIsRegistering(true)}
              style={{ 
                flex: 1, 
                padding: '0.75rem', 
                borderRadius: '10px', 
                border: 'none',
                background: isRegistering ? 'var(--primary-color)' : 'transparent',
                color: isRegistering ? 'white' : 'var(--color-text-muted)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Sign Up
            </button>
          </div>

          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
            {isRegistering ? 'Create an Account' : 'Welcome Back'}
          </h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
            {isRegistering ? 'Join Pawaa to start tracking outages.' : 'Log in to manage your reports and alerts.'}
          </p>

          <form onSubmit={handleEmailAuth} style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <input 
                type="email" 
                className="input-field" 
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="input-group">
              <label className="input-label">Password</label>
              <input 
                type="password" 
                className="input-field" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '0.5rem', padding: '1rem' }}
              disabled={authLoading}
            >
              {authLoading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', gap: '1rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }}></div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }}></div>
          </div>

          <button 
            className="btn btn-outline" 
            onClick={handleGoogleLogin} 
            style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            disabled={authLoading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: '0.75rem' }}>
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
};

const InfoFeature = ({ icon, title, desc }: any) => (
  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
    <div style={{ 
      color: 'var(--primary-color)', 
      background: 'rgba(37, 99, 235, 0.1)', 
      padding: '0.6rem', 
      borderRadius: '10px' 
    }}>
      {icon}
    </div>
    <div>
      <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.2rem' }}>{title}</h4>
      <p style={{ fontSize: '0.85rem', opacity: 0.7, lineHeight: 1.4 }}>{desc}</p>
    </div>
  </div>
);
