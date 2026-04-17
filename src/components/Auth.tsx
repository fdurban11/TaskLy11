"use client";
import React, { useState, useEffect } from 'react';
import { supabase, isMockMode } from '@/lib/supabaseClient';
import styles from './Auth.module.css';
import { Hexagon, CheckCircle2, Mail } from 'lucide-react';

export default function Auth({ onLogin }: { onLogin: (userId: string, email: string) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [emailVal, setEmailVal] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [supabaseError, setSupabaseError] = useState(false);
  const [registered, setRegistered] = useState(false);

  // Verification step state
  const [verifying, setVerifying] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  // Password Reset state
  const [isReset, setIsReset] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);


  useEffect(() => {
    if (isMockMode) {
      const mockUser = localStorage.getItem('mockUserId');
      const mockEmail = localStorage.getItem('mockUserEmail');
      if (mockUser && mockEmail) onLogin(mockUser, mockEmail);
    } else {
      // Check connectivity — if this times out or errors, show a warning banner.
      const timeout = setTimeout(() => setSupabaseError(true), 7000);

      supabase.auth.getSession()
        .then(({ data: { session } }) => {
          clearTimeout(timeout);
          setSupabaseError(false);
          if (session?.user) onLogin(session.user.id, session.user.email || '');
        })
        .catch(() => {
          clearTimeout(timeout);
          setSupabaseError(true);
        });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) onLogin(session.user.id, session.user.email || '');
      });
      return () => {
        clearTimeout(timeout);
        subscription.unsubscribe();
      };
    }
  }, [onLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailVal || !password) return;
    setLoading(true);
    setError('');
    setPasswordError('');

    if (!isLogin && password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (isMockMode) {
      setTimeout(() => {
        const mockId = 'mock_' + emailVal.replace(/[^a-zA-Z0-9]/g, '');
        localStorage.setItem('mockUserId', mockId);
        localStorage.setItem('mockUserEmail', emailVal);
        onLogin(mockId, emailVal);
      }, 500);
      return;
    }

    // For sign-in, proceed normally
    if (isLogin) {
      try {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: emailVal, password });
        if (signInError) {
          const msg = signInError.message.toLowerCase();
          if (msg.includes('email not confirmed')) {
            setError('Your email address is not confirmed yet. Please check your inbox for a confirmation link.');
          } else if (msg.includes('invalid login credentials')) {
            setError('Incorrect email or password. Please try again.');
          } else {
            setError(signInError.message);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Authentication failed');
      } finally {
        setLoading(false);
      }
      return;
    }

    // For sign-up: send verification code first
    try {
      const res = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', email: emailVal }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send verification code. Please try again.');
        setLoading(false);
        return;
      }

      // Show verification step
      setVerifying(true);
      setVerifyCode('');
      setVerifyError('');
      setResendMsg('');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode) return;
    setLoading(true);
    setVerifyError('');

    try {
      // 1. Verify the code
      const res = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', email: emailVal, code: verifyCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        setVerifyError(data.error || 'Invalid verification code. Please try again.');
        setLoading(false);
        return;
      }

      // 2. Code is correct — create Supabase account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: emailVal,
        password,
      });

      if (signUpError) {
        if (signUpError.message.toLowerCase().includes('already registered')) {
          setVerifyError('This email is already registered. Please sign in instead.');
        } else {
          setVerifyError(signUpError.message);
        }
        setLoading(false);
        return;
      }

      if (signUpData.session) {
        // Email confirmation OFF — auto logged in
        onLogin(signUpData.session.user.id, signUpData.session.user.email || emailVal);
      } else {
        // Email confirmation ON
        setVerifying(false);
        setRegistered(true);
      }
    } catch (err: any) {
      setVerifyError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendMsg('');
    setVerifyError('');
    try {
      const res = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', email: emailVal }),
      });
      const data = await res.json();
      if (res.ok) {
        setResendMsg('A new code has been sent to your email.');
      } else {
        setVerifyError(data.error || 'Failed to resend code.');
      }
    } catch (err: any) {
      setVerifyError(err.message || 'Failed to resend code.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailVal) return;
    setLoading(true);
    setError('');

    if (isMockMode) {
      setTimeout(() => {
        setResetSuccess(true);
        setLoading(false);
      }, 500);
      return;
    }

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(emailVal, {
        redirectTo: window.location.origin + '/dashboard',
      });
      if (resetError) {
        setError(resetError.message);
      } else {
        setResetSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  };


  // ── Registered (email confirmation required) screen ──
  if (registered) {
    return (
      <div className={styles.authContainer}>
        <div className={`${styles.authCard} glass-panel`}>
          <div className={styles.authHeader}>
            <CheckCircle2 size={48} color="var(--primary)" style={{ margin: '0 auto 10px' }} />
            <h2>Account Created!</h2>
            <p>Check your email inbox and click the confirmation link, then come back to sign in.</p>
          </div>
          <button
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '20px' }}
            onClick={() => { setRegistered(false); setIsLogin(true); setError(''); }}
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  // ── Verification code step ──
  if (verifying) {
    return (
      <div className={styles.authContainer}>
        <div className={`${styles.authCard} glass-panel`}>
          <div className={styles.authHeader}>
            <Mail size={48} color="var(--accent-blue)" style={{ margin: '0 auto 10px' }} />
            <h2>Check Your Email</h2>
            <p>
              We sent a 6-digit verification code to<br />
              <strong style={{ color: 'var(--accent-blue)' }}>{emailVal}</strong>
            </p>
          </div>

          <form className={styles.authForm} onSubmit={handleVerify}>
            {verifyError && <div className={styles.errorMsg}>{verifyError}</div>}
            {resendMsg && (
              <div style={{
                color: 'var(--text-highlight)',
                fontSize: '0.85rem',
                textAlign: 'center',
                padding: '10px',
                background: 'rgba(0,229,204,0.08)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(0,229,204,0.2)',
              }}>
                {resendMsg}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '10px' }}>
              <label className="form-label">Verification Code</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter 6-digit code"
                value={verifyCode}
                onChange={(e) => { setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setVerifyError(''); }}
                required
                maxLength={6}
                autoComplete="one-time-code"
                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.3em', fontWeight: 700 }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '10px' }}
              disabled={loading || verifyCode.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify & Create Account'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '14px' }}>
              <button
                type="button"
                className={styles.toggleBtn}
                onClick={handleResend}
                disabled={resendLoading}
                style={{ fontSize: '0.85rem' }}
              >
                {resendLoading ? 'Sending...' : 'Resend Code'}
              </button>
            </div>
          </form>

          <div className={styles.toggleText}>
            <button
              className={styles.toggleBtn}
              onClick={() => { setVerifying(false); setVerifyError(''); setResendMsg(''); }}
            >
              ← Back to sign up
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Password Reset screen ──
  if (isReset) {
    return (
      <div className={styles.authContainer}>
        <div className={`${styles.authCard} glass-panel`}>
          <div className={styles.authHeader}>
            <Hexagon size={48} color="var(--accent-blue)" style={{ margin: '0 auto 10px' }} />
            <h2>Reset Password</h2>
            <p>Enter your email to receive a reset link</p>
          </div>

          {resetSuccess ? (
            <div className={styles.successMsg}>
              Password reset link has been sent to your email.
            </div>
          ) : (
            <form className={styles.authForm} onSubmit={handleResetPassword}>
              {error && <div className={styles.errorMsg}>{error}</div>}
              
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="you@example.com"
                  value={emailVal}
                  onChange={(e) => setEmailVal(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <div className={styles.toggleText}>
            <button 
              className={styles.toggleBtn} 
              onClick={() => { setIsReset(false); setResetSuccess(false); setError(''); }}
            >
              ← Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main login / sign-up form ──

  return (
    <div className={styles.authContainer}>
      {supabaseError && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          background: 'rgba(239,68,68,0.92)',
          backdropFilter: 'blur(8px)',
          color: '#fff',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.875rem',
          fontWeight: 500,
          zIndex: 9999,
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
        }}>
          <span>⚠️</span>
          <span>
            <strong>Cannot connect to Supabase.</strong> The project URL or anon key in{' '}
            <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px' }}>.env.local</code>{' '}
            is invalid or the project has been deleted. Update your credentials and restart the dev server.
          </span>
        </div>
      )}
      <div className={`${styles.authCard} glass-panel`}>
        <div className={styles.authHeader}>
          <Hexagon size={48} color="var(--accent-blue)" style={{ margin: '0 auto 10px' }} />
          <h2>Welcome to Taskly</h2>
          <p>{isLogin ? 'Sign in to manage your tasks' : 'Create an account to get started'}</p>
        </div>

        <form className={styles.authForm} onSubmit={handleSubmit}>
          {error && <div className={styles.errorMsg}>{error}</div>}
          
          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label className="form-label">Email</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="you@example.com"
              value={emailVal}
              onChange={(e) => setEmailVal(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
              required
              minLength={6}
            />
          </div>

          {isLogin && (
            <div className={styles.forgotPasswordContainer}>
              <button 
                type="button" 
                className={styles.forgotPasswordLink}
                onClick={() => { setIsReset(true); setError(''); }}
              >
                Forgot Password?
              </button>
            </div>
          )}


          {!isLogin && (
            <div className="form-group" style={{ marginBottom: '10px' }}>
              <label className="form-label">Confirm Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                required={!isLogin}
                minLength={6}
              />
              {passwordError && (
                <div style={{ color: 'var(--accent-pink)', fontSize: '0.85rem', marginTop: '5px' }}>
                  {passwordError}
                </div>
              )}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className={styles.toggleText}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button className={styles.toggleBtn} onClick={() => { setIsLogin(!isLogin); setError(''); setPasswordError(''); }}>
            {isLogin ? 'Create account' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
