import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

function ResetPasswordPage({ onSubmit }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const uid = searchParams.get('uid') || '';
  const token = searchParams.get('token') || '';

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    const result = await onSubmit({
      uid,
      token,
      newPassword: formData.newPassword,
      confirmPassword: formData.confirmPassword
    });

    if (!result.ok) {
      setError(result.message);
      setIsSubmitting(false);
      return;
    }

    setSuccess(result.message);
    setIsSubmitting(false);
    window.setTimeout(() => {
      navigate('/login');
    }, 1200);
  };

  if (!uid || !token) {
    return (
      <section className="auth-wrap">
        <div className="auth-card">
          <h2>Reset Password</h2>
          <p className="auth-error">This reset link is invalid or incomplete.</p>
          <p className="auth-meta">
            Request a new one from <Link to="/forgot-password">Forgot Password</Link>.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-wrap">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Reset Password</h2>
        <p>Set your new password for Smart Campus Exchange.</p>
        <label>
          New Password
          <input
            name="newPassword"
            type="password"
            value={formData.newPassword}
            onChange={handleChange}
            placeholder="Enter new password"
            required
          />
        </label>
        <label>
          Confirm New Password
          <input
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter new password"
            required
          />
        </label>
        {error && <p className="auth-error">{error}</p>}
        {success && <p className="form-feedback form-success">{success}</p>}
        <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Resetting...' : 'Reset Password'}
        </button>
        <p className="auth-meta">
          Back to <Link to="/login">login</Link>
        </p>
      </form>
    </section>
  );
}

export default ResetPasswordPage;
