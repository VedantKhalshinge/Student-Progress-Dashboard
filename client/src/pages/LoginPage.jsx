import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GraduationCap, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const autoLoginAttempted = useRef(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await login(email, password);
      if (user.role === 'MENTOR') {
        navigate('/mentor');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.response?.data?.error || 'Invalid credentials. Please verify email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLoading(true);
    setError('');

    login(demoEmail, demoPassword)
      .then((user) => {
        if (user.role === 'MENTOR') {
          navigate('/mentor' + window.location.search);
        } else {
          navigate('/dashboard' + window.location.search);
        }
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Login failed');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (autoLoginAttempted.current) return;
    const demo = searchParams.get('demo');
    if (demo === 'student1') {
      autoLoginAttempted.current = true;
      handleQuickLogin('student1@example.com', 'password123');
    } else if (demo === 'student2') {
      autoLoginAttempted.current = true;
      handleQuickLogin('student2@example.com', 'password123');
    } else if (demo === 'mentor1') {
      autoLoginAttempted.current = true;
      handleQuickLogin('mentor1@example.com', 'password123');
    } else if (demo === 'mentor2') {
      autoLoginAttempted.current = true;
      handleQuickLogin('mentor2@example.com', 'password123');
    }
  }, [searchParams]);

  return (
    <div className="login-page-container">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo-circle">
            <GraduationCap size={32} />
          </div>
          <h1 className="login-title">Student Progress Portal</h1>
          <p className="login-subtitle">
            Sign in to access real-time course analytics, daily study logs, and curriculum progress.
          </p>
        </div>

        {error && (
          <div className="alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div className="input-icon-wrap">
              <Mail size={18} className="input-icon" />
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="e.g. student1@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-icon-wrap">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Quick Demo Logins Section */}
        <div className="demo-accounts-box">
          <div className="demo-box-title">
            <span>Instant Demo Accounts</span>
          </div>
          <p className="demo-box-hint">Click below to log in instantly with pre-seeded role data:</p>

          <div className="demo-buttons-grid">
            <button
              type="button"
              className="demo-btn demo-btn-student"
              onClick={() => handleQuickLogin('student1@example.com', 'password123')}
              disabled={loading}
            >
              <UserCheck size={16} />
              <div className="demo-btn-text">
                <strong>imran hashmi</strong>
                <small>Student (73% complete)</small>
              </div>
            </button>

            <button
              type="button"
              className="demo-btn demo-btn-student"
              onClick={() => handleQuickLogin('student2@example.com', 'password123')}
              disabled={loading}
            >
              <UserCheck size={16} />
              <div className="demo-btn-text">
                <strong>Adolf Hitler</strong>
                <small>Student (50% complete)</small>
              </div>
            </button>

            <button
              type="button"
              className="demo-btn demo-btn-mentor"
              onClick={() => handleQuickLogin('mentor1@example.com', 'password123')}
              disabled={loading}
            >
              <ShieldCheck size={16} />
              <div className="demo-btn-text">
                <strong>Alexander thegreat</strong>
                <small>Mentor (3 assigned students)</small>
              </div>
            </button>

            <button
              type="button"
              className="demo-btn demo-btn-mentor"
              onClick={() => handleQuickLogin('mentor2@example.com', 'password123')}
              disabled={loading}
            >
              <ShieldCheck size={16} />
              <div className="demo-btn-text">
                <strong>goodboy Vedant</strong>
                <small>Mentor (2 assigned students)</small>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
