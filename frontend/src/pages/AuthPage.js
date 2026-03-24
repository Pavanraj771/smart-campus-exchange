import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function AuthPage({ mode, title, helperText, buttonText, onSubmit }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const result = await onSubmit(formData);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    navigate('/profile');
  };

  const handleGmailClick = () => {
    setError('Gmail sign-in will be enabled when backend Google OAuth is connected.');
  };

  return (
    <section className="auth-wrap">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>{title}</h2>
        <p>{helperText}</p>
        <label>
          Email
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="yourname@nitw.ac.in"
            required
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter password"
            required
          />
        </label>
        {mode === 'register' && (
          <label>
            Confirm Password
            <input
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
              required
            />
          </label>
        )}
        {error && <p className="auth-error">{error}</p>}
        <button className="btn btn-primary" type="submit">
          {buttonText}
        </button>
        <div className="auth-divider">
          <span>or</span>
        </div>
        <button className="btn btn-gmail" type="button" onClick={handleGmailClick}>
          <span className="google-mark" aria-hidden="true">
            G
          </span>
          Continue with Gmail
        </button>
        <p className="auth-subnote">Use your NITW Google account ending with nitw.ac.in.</p>
        {mode === 'login' ? (
          <>
            <p className="auth-meta">
              New user? <Link to="/register">Create account</Link>
            </p>
            <p className="auth-meta">
              Forgot password? <Link to="/forgot-password">Reset it here</Link>
            </p>
          </>
        ) : (
          <p className="auth-meta">
            Already registered? <Link to="/login">Login</Link>
          </p>
        )}
      </form>
    </section>
  );
}

export default AuthPage;
