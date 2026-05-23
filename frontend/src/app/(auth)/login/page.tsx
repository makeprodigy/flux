'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const [role, setRole] = useState<UserRole>('teacher');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const DEMO_EMAIL = 'demo@vedaai.app';
  const DEMO_PASSWORD = 'Demo@1234';

  const fillDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setRole('teacher');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authApi.login(email, password, role);
      const { user, token } = response.data.data;
      setUser(user, token);
      router.replace('/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(
        axiosErr.response?.data?.message ?? 'Invalid email or password. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* Left Panel */}
      <div className="auth-left">
        <div className="auth-orb-1"></div>
        <div className="auth-orb-2"></div>
        
        <div className="auth-left-content">
          <div className="auth-left-logo-row">
            <div className="auth-logo-box">V</div>
            <span className="auth-left-logo-text">VedaAI</span>
          </div>
          
          <div>
            <div className="auth-left-hero-bar"></div>
            <h2 className="auth-left-hero-title">
              The intelligent OS<br/>for modern classrooms.
            </h2>
            <p className="auth-left-hero-desc">
              Automate assignments, generate brilliant question papers, and reclaim hours of your time every single week.
            </p>
          </div>
          
          <div className="auth-left-social">
            <div className="auth-avatar-group">
              <div className="auth-avatar" style={{ background: '#1A1A1A' }}>JD</div>
              <div className="auth-avatar" style={{ background: '#FF5623' }}>AS</div>
              <div className="auth-avatar" style={{ background: '#2A2A2A' }}>+1k</div>
            </div>
            <div style={{ color: '#808080', fontSize: '14px', fontWeight: 500 }}>
              Join thousands of educators
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="auth-right">
        <div className="auth-form-container">
          
          <div style={{ marginBottom: '16px' }}>
            <h1 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 700, fontSize: '24px', color: '#171717', marginBottom: '4px', letterSpacing: '-0.5px' }}>
              Welcome back
            </h1>
            <p style={{ color: '#666666', fontSize: '13px' }}>Please enter your details to sign in.</p>
          </div>

          {/* Demo credentials banner */}
          <div style={{ background: 'linear-gradient(135deg, #fff8f6, #fff3ef)', border: '1px solid #ffd4c8', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: '#FF5623', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>🎯 Demo Account</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#555', fontFamily: 'monospace' }}>{DEMO_EMAIL}</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#555', fontFamily: 'monospace' }}>{DEMO_PASSWORD}</p>
            </div>
            <button
              type="button"
              onClick={fillDemo}
              style={{ background: '#FF5623', color: 'white', border: 'none', borderRadius: '7px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              Fill In →
            </button>
          </div>

          {/* Role toggle */}
          <div className="auth-role-toggle">
            {(['teacher', 'student'] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`auth-role-btn ${role === r ? 'active' : ''}`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="auth-error">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ flexShrink: 0, marginTop: '2px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p style={{ margin: 0, lineHeight: 1.5 }}>{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="auth-input-group">
              <label className="auth-label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@school.edu"
                required
                className="auth-input"
              />
            </div>

            <div className="auth-input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="auth-label" style={{ margin: 0 }}>Password</label>
                <Link href="#" className="auth-link" style={{ fontSize: '13px', textTransform: 'none', color: '#FF5623' }}>
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="auth-input"
                style={{ letterSpacing: '2px' }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="auth-btn"
            >
              {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  Authenticating...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Sign In
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
              )}
            </button>
          </form>

          {/* Sign up link */}
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #EAEAEA', textAlign: 'center' }}>
            <p style={{ color: '#666666', fontSize: '13px' }}>
              Don&apos;t have an account?{' '}
              <Link href="/register" className="auth-link">
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

