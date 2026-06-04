import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import AuthLayout from '../components/AuthLayout';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!identifier || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }
      
      // Store user info and token
      localStorage.setItem('userInfo', JSON.stringify(data));
      // Redirect to dashboard or home
      alert('Login successful! Redirecting to Dashboard...');
      navigate('/dashboard'); // We will build this later
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Google Auth Failed');
      
      localStorage.setItem('userInfo', JSON.stringify(data));
      alert('Login via Google successful!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleError = () => {
    setError('Google Sign-In was unsuccessful. Try again later.');
  };

  return (
    <AuthLayout 
      title="Login page" 
      subtitle="Start your journey now with us"
    >
      <div className="auth-form-header">
        <h2>Login to your account</h2>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="identifier">Email or Username</label>
          <input 
            type="text" 
            id="identifier" 
            className="form-input" 
            placeholder="Enter your email or username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label className="form-label" htmlFor="password">Password</label>
          <input 
            type={showPassword ? "text" : "password"} 
            id="password" 
            className="form-input" 
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button 
            type="button" 
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        
        <div className="form-actions">
          <div></div> {/* For spacing */}
          <Link to="/forgot-password" className="forgot-password">Forgot ?</Link>
        </div>
        
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Logging in...' : 'Login now'}
        </button>

        <div className="divider">or</div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
          />
        </div>
      </form>
      
      <div className="auth-footer">
        Don't have an account? <Link to="/register">Sign up</Link>
      </div>
    </AuthLayout>
  );
};

export default Login;
