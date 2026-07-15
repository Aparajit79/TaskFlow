import React, { useState, useEffect } from 'react';
import { KeyRound, ShieldAlert, UserCheck, Shield, ChevronDown } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function LoginView({ onLoginSuccess }) {
  const [isAdmin, setIsAdmin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [membersList, setMembersList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch usernames for dropdown when member tab is active
  useEffect(() => {
    if (!isAdmin) {
      setLoading(true);
      fetch(`${API_URL}/users/members`, { credentials: 'include' })
        .then((res) => {
          if (!res.ok) throw new Error('Failed to load team list');
          return res.json();
        })
        .then((data) => {
          setMembersList(data);
          if (data.length > 0) {
            setUsername(data[0].username);
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [isAdmin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = isAdmin
      ? { type: 'admin', email: email.trim(), password }
      : { type: 'member', username, password };

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container app-card">
        <div className="login-header">
          <div className="login-logo-circle">
            <KeyRound size={22} className="login-logo-icon" />
          </div>
          <h2>Sign In to TaskMatrix</h2>
          <p>Access your projects and collaborative boards</p>
        </div>

        <div className="login-tabs">
          <button 
            type="button" 
            className={`login-tab-btn ${isAdmin ? 'active' : ''}`}
            onClick={() => {
              setIsAdmin(true);
              setError(null);
            }}
          >
            <Shield size={14} className="margin-right-6" />
            Admin Portal
          </button>
          <button 
            type="button" 
            className={`login-tab-btn ${!isAdmin ? 'active' : ''}`}
            onClick={() => {
              setIsAdmin(false);
              setError(null);
            }}
          >
            <UserCheck size={14} className="margin-right-6" />
            Team Member Portal
          </button>
        </div>

        {error && (
          <div className="alert alert-danger login-error-alert">
            <ShieldAlert size={16} className="flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {isAdmin ? (
            <div className="form-group">
              <label htmlFor="email">Admin Email</label>
              <input
                id="email"
                type="email"
                placeholder="admin@taskflow.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="task-input"
                required
                autoFocus
              />
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="username">Select Workspace Member</label>
              <div className="custom-select-wrapper">
                <select
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="select-input select-full-width"
                  required
                  disabled={loading && membersList.length === 0}
                >
                  {membersList.length === 0 && !loading && (
                    <option value="">No registered members found</option>
                  )}
                  {membersList.map((member) => (
                    <option key={member.id} value={member.username}>
                      {member.name} ({member.username})
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="select-arrow-icon" />
              </div>
            </div>
          )}

          <div className="form-group margin-top-16">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="task-input"
              required
            />
          </div>

          <button 
            type="submit" 
            className="primary-btn login-submit-btn login-submit-btn-override" 
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginView;
