import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function ForgotPasswordPage({ onSubmit }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const result = await onSubmit(formData);
    if (!result.ok) {
      setError(result.message);
      return;
    }

    setSuccess(result.message);
    window.setTimeout(() => {
      navigate('/login');
    }, 1200);
  };

  return (
    <section className="auth-wrap">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Forgot Password</h2>
        <p>Reset your account password using your NITW email ending with nitw.ac.in.</p>
        <label>
          Email
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="yourname@student.nitw.ac.in"
            required
          />
        </label>
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
        <button className="btn btn-primary" type="submit">
          Reset Password
        </button>
        <p className="auth-meta">
          Remembered it? <Link to="/login">Back to login</Link>
        </p>
      </form>
    </section>
  );
}

export default ForgotPasswordPage;
