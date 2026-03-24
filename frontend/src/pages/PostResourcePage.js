import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const initialFormData = {
  title: '',
  category: 'Electronics',
  condition: 'Good',
  department: '',
  location: '',
  imageUrl: '',
  description: ''
};

function PostResourcePage({ currentUser, onSubmit }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormData);
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

    setFormData(initialFormData);
    setSuccess('Resource posted successfully. Redirecting to the marketplace...');
    window.setTimeout(() => {
      navigate('/resources');
    }, 900);
  };

  return (
    <section className="post-resource-wrap">
      <div className="section-head">
        <h2>Post a New Resource</h2>
        <p>
          Add item details so other students can discover and request it.
          {` Posting as ${currentUser.email}.`}
        </p>
      </div>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Title
          <input
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            placeholder="Ex: Arduino Uno Kit"
          />
        </label>
        <label>
          Category
          <select name="category" value={formData.category} onChange={handleChange}>
            <option>Electronics</option>
            <option>Books</option>
            <option>Lab Equipment</option>
            <option>Notes</option>
          </select>
        </label>
        <label>
          Condition
          <select name="condition" value={formData.condition} onChange={handleChange}>
            <option>New</option>
            <option>Excellent</option>
            <option>Very Good</option>
            <option>Good</option>
          </select>
        </label>
        <label>
          Department
          <input
            name="department"
            type="text"
            value={formData.department}
            onChange={handleChange}
            placeholder="Ex: ECE"
          />
        </label>
        <label>
          Pickup Location
          <input
            name="location"
            type="text"
            value={formData.location}
            onChange={handleChange}
            placeholder="Ex: Library Block A"
          />
        </label>
        <label className="span-2">
          Image URL
          <input
            name="imageUrl"
            type="url"
            value={formData.imageUrl}
            onChange={handleChange}
            placeholder="https://example.com/resource-image.jpg"
          />
        </label>
        <label className="span-2">
          Description
          <textarea
            name="description"
            rows="5"
            value={formData.description}
            onChange={handleChange}
            placeholder="Mention what is included and any usage notes."
          />
        </label>
        {error && <p className="form-feedback form-error span-2">{error}</p>}
        {success && <p className="form-feedback form-success span-2">{success}</p>}
        <button className="btn btn-primary form-submit-btn" type="submit">
          Submit Resource
        </button>
      </form>
    </section>
  );
}

export default PostResourcePage;
