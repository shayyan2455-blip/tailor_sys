import { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { authApi } from '../api/authApi';

export default function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [otpMode, setOtpMode] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [forgotForm, setForgotForm] = useState({ username: '', otp: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (isAuthenticated) {
    return <Navigate to={user?.role === 'Worker' ? '/production' : '/'} replace />;
  }

  async function submit(event) {
    event.preventDefault();
    event.stopPropagation();
    console.log('Form submission prevented');
    setError('');
    setBusy(true);
    try {
      console.log('Attempting login with:', form.username);
      const loggedIn = await login(form);
      console.log('Login successful:', loggedIn);
      const target = location.state?.from?.pathname || (loggedIn.role === 'Worker' ? '/production' : '/');
      console.log('Navigating to:', target);
      navigate(target, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError(err.error?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotPassword(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    try {
      await authApi.forgotPassword({ username: forgotForm.username });
      setMessage('OTP has been sent to your email');
      setOtpMode(true);
    } catch (err) {
      setError(err.error?.message || 'Failed to send OTP');
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOTP(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    try {
      await authApi.verifyOTP({ username: forgotForm.username, otp: forgotForm.otp });
      setMessage('OTP verified. Please set your new password');
      setResetMode(true);
    } catch (err) {
      setError(err.error?.message || 'Invalid OTP');
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    
    // Validate password
    if (!forgotForm.newPassword.trim()) {
      setError('Password is required');
      return;
    }
    if (forgotForm.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!/[a-z]/.test(forgotForm.newPassword)) {
      setError('Password must contain at least one lowercase letter');
      return;
    }
    if (!/[A-Z]/.test(forgotForm.newPassword)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }
    if (!/[0-9]/.test(forgotForm.newPassword)) {
      setError('Password must contain at least one number');
      return;
    }
    if (!/[^a-zA-Z0-9]/.test(forgotForm.newPassword)) {
      setError('Password must contain at least one special character');
      return;
    }
    if (forgotForm.newPassword !== forgotForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setBusy(true);
    try {
      await authApi.resetPassword({
        username: forgotForm.username,
        otp: forgotForm.otp,
        newPassword: forgotForm.newPassword
      });
      setMessage('Password reset successfully. Please login with your new password');
      setForgotMode(false);
      setOtpMode(false);
      setResetMode(false);
      setForgotForm({ username: '', otp: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.error?.message || 'Failed to reset password');
    } finally {
      setBusy(false);
    }
  }

  function resetForgotFlow() {
    setForgotMode(false);
    setOtpMode(false);
    setResetMode(false);
    setForgotForm({ username: '', otp: '', newPassword: '', confirmPassword: '' });
    setError('');
    setMessage('');
  }

  return (
    <main className="login-page d-flex align-items-center justify-content-center">
      {showSplash && (
        <div className="splash-screen position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-white" style={{ zIndex: 9999, transition: 'opacity 0.5s ease-out' }}>
          <div className="d-flex align-items-center gap-3 mb-4 fade-in">
            <i className="bi bi-scissors fs-1 text-primary" />
            <h1 className="h3 mb-0 fw-bold text-dark">Tailor ERP</h1>
          </div>
          <div className="text-muted fade-in-delayed" style={{ fontSize: '0.9rem', letterSpacing: '0.5px' }}>
            A service by <span className="fw-semibold text-primary">Liberal Tech</span>
          </div>
        </div>
      )}
      <form className="login-panel bg-white border rounded-2 p-3" onSubmit={forgotMode ? (resetMode ? handleResetPassword : otpMode ? handleVerifyOTP : handleForgotPassword) : submit}>
        <div className="d-flex align-items-center gap-2 mb-3">
          <i className="bi bi-scissors fs-4 text-primary" />
          <div>
            <h1 className="h5 mb-0">Tailor ERP</h1>
            <div className="small text-muted">{forgotMode ? 'Password Recovery' : 'Secure staff login'}</div>
          </div>
        </div>
        {error && <div className="alert alert-danger py-2 small">{error}</div>}
        {message && <div className="alert alert-success py-2 small">{message}</div>}
        
        {!forgotMode ? (
          <>
            <label className="form-label small">Email</label>
            <input className="form-control form-control-sm mb-2" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required autoFocus />
            <label className="form-label small">Password</label>
            <input className="form-control form-control-sm mb-2" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
            <div className="form-check mb-3">
              <input className="form-check-input" type="checkbox" id="showPassword" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
              <label className="form-check-label small" htmlFor="showPassword">Show password</label>
            </div>
            <button className="btn btn-primary btn-sm w-100 mb-2" type="submit" disabled={busy}>
              <i className="bi bi-box-arrow-in-right me-1" />
              Sign in
            </button>
            <button className="btn btn-link btn-sm w-100 text-decoration-none" type="button" onClick={() => setForgotMode(true)}>
              Forgot password?
            </button>
          </>
        ) : (
          <>
            <label className="form-label small">Email</label>
            <input 
              className="form-control form-control-sm mb-2" 
              value={forgotForm.username} 
              onChange={(event) => setForgotForm({ ...forgotForm, username: event.target.value })} 
              required 
              disabled={otpMode || resetMode}
              autoFocus={!otpMode && !resetMode}
            />
            
            {otpMode && (
              <>
                <label className="form-label small">OTP (8 digits)</label>
                <input 
                  className="form-control form-control-sm mb-2" 
                  value={forgotForm.otp} 
                  onChange={(event) => setForgotForm({ ...forgotForm, otp: event.target.value })} 
                  required 
                  maxLength={8}
                  autoFocus={!resetMode}
                />
              </>
            )}
            
            {resetMode && (
              <>
                <label className="form-label small">New Password</label>
                <div className="input-group input-group-sm mb-2">
                  <input
                    className="form-control"
                    type={showPassword ? 'text' : 'password'}
                    value={forgotForm.newPassword}
                    onChange={(event) => setForgotForm({ ...forgotForm, newPassword: event.target.value })}
                    required
                    minLength={8}
                    autoFocus
                  />
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
                <div className="form-text small mb-2">Minimum 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol</div>
                
                <label className="form-label small">Confirm Password</label>
                <input
                  className="form-control form-control-sm mb-2"
                  type={showPassword ? 'text' : 'password'}
                  value={forgotForm.confirmPassword}
                  onChange={(event) => setForgotForm({ ...forgotForm, confirmPassword: event.target.value })}
                  required
                  placeholder="Confirm password"
                />
              </>
            )}
            
            <button className="btn btn-primary btn-sm w-100 mb-2" type="submit" disabled={busy}>
              {resetMode ? 'Reset Password' : otpMode ? 'Verify OTP' : 'Send OTP'}
            </button>
            <button className="btn btn-link btn-sm w-100 text-decoration-none" type="button" onClick={resetForgotFlow}>
              Back to login
            </button>
          </>
        )}
      </form>
    </main>
  );
}
