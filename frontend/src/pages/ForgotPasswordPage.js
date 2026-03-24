import { useState } from 'react';
import { Link } from 'react-router-dom';

function ForgotPasswordPage({ onSubmit }) {
  const [formData, setFormData] = useState({
    email: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    const result = await onSubmit(formData);
    if (!result.ok) {
      setError(result.message);
      setIsSubmitting(false);
      return;
    }

    setSuccess(result.message);
    setIsSubmitting(false);
  };

  return (
    <section className="auth-wrap">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Forgot Password</h2>
        <p>Enter your NITW email ending with nitw.ac.in and a reset link will be generated.</p>
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
        {error && <p className="auth-error">{error}</p>}
        {success && <p className="form-feedback form-success">{success}</p>}
        <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send Reset Link'}
        </button>
        <p className="auth-meta">
          Remembered it? <Link to="/login">Back to login</Link>
        </p>
      </form>
    </section>
  );
}

export default ForgotPasswordPage;
