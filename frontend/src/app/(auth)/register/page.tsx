'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Logo } from '@/components/Logo';

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [schoolLocation, setSchoolLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const DEMO_EMAIL = 'demo@vedaai.app';
  const DEMO_PASSWORD = 'Demo@1234';

  const fillDemo = () => {
    setName('Demo Teacher');
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setSchoolName('Springfield Academy');
    setSchoolLocation('New Delhi, India');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authApi.register({
        name,
        email,
        password,
        role: 'teacher',
        schoolName,
        schoolLocation,
      });
      const { user, token } = response.data.data;
      setUser(user, token);
      router.replace('/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(
        axiosErr.response?.data?.message ?? 'Registration failed. Please try again.',
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
          <div className="auth-left-logo-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
            <Logo className="w-[48px] h-[48px] shadow-lg" />
            <span className="auth-left-logo-text" style={{ margin: 0 }}>VedaAI</span>
          </div>
          
          <div>
            <div className="auth-left-hero-bar"></div>
            <h2 className="auth-left-hero-title">
              Join the future<br/>of education.
            </h2>
            <p className="auth-left-hero-desc">
              Create an account in seconds and experience the most powerful AI toolkit designed exclusively for educators.
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
        <div className="auth-form-container" style={{ padding: '20px 0' }}>
          
          <div style={{ marginBottom: '16px' }}>
            <h1 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 700, fontSize: '24px', color: '#352B25', marginBottom: '4px', letterSpacing: '-0.5px' }}>
              Create an account
            </h1>
            <p style={{ color: '#666666', fontSize: '13px' }}>Get started with VedaAI for free.</p>
          </div>

          {/* Demo credentials banner */}
          <div className="flex items-center justify-between gap-4 p-4 mb-6 rounded-2xl bg-gradient-to-br from-[#FFF4F1] to-[#FFF9F8] border border-[#FFE0D6] shadow-[0_2px_12px_rgba(216,67,21,0.06)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF5623] opacity-[0.03] blur-2xl rounded-full group-hover:opacity-[0.06] transition-opacity duration-500 pointer-events-none" />
            
            <div className="relative z-10 flex-1">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF5623] shadow-[0_0_8px_rgba(255,86,35,0.6)]" />
                <p className="m-0 text-[10px] font-bold text-[#FF5623] uppercase tracking-widest font-heading">Try Demo Account Instead</p>
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="m-0 text-[13px] text-[#4B5563] font-medium font-inter">{DEMO_EMAIL}</p>
                <p className="m-0 text-[13px] text-[#9CA3AF] font-medium font-inter tracking-wider">•••••••••</p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={fillDemo}
              className="relative z-10 flex items-center gap-2 bg-[#FF5623] text-white border-none rounded-xl px-4 py-2.5 text-[12px] font-bold font-heading shadow-[0_4px_12px_rgba(255,86,35,0.2)] hover:bg-[#E64A19] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(255,86,35,0.3)] transition-all duration-300 cursor-pointer whitespace-nowrap"
            >
              Auto-Fill Form
            </button>
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
              <label className="auth-label">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                required
                className="auth-input"
              />
            </div>

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
              <label className="auth-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="auth-input"
                style={{ letterSpacing: '2px' }}
              />
            </div>

            <div className="auth-divider">
              <div className="auth-divider-line"></div>
              <span className="auth-divider-text">Optional School Info</span>
              <div className="auth-divider-line"></div>
            </div>

            <div className="auth-input-group">
              <label className="auth-label">School Name</label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Springfield High School"
                className="auth-input"
              />
            </div>

            <div className="auth-input-group">
              <label className="auth-label">School Location</label>
              <input
                type="text"
                value={schoolLocation}
                onChange={(e) => setSchoolLocation(e.target.value)}
                placeholder="City, State"
                className="auth-input"
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
                  Creating account...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Create Account
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
              )}
            </button>
          </form>

          {/* Login link */}
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #EAEAEA', textAlign: 'center' }}>
            <p style={{ color: '#666666', fontSize: '13px' }}>
              Already have an account?{' '}
              <Link href="/login" className="auth-link">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
