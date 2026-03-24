import { useEffect, useState } from 'react';
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

function PostResourcePage({
  currentUser,
  onSubmit,
  initialData = null,
  title = 'Post a New Resource',
  helperText = 'Add item details so other students can discover and request it.',
  buttonText = 'Submit Resource',
  successMessage = 'Resource saved successfully. Redirecting to the marketplace...'
}) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialData || initialFormData);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReadingImage, setIsReadingImage] = useState(false);

  useEffect(() => {
    setFormData(initialData || initialFormData);
  }, [initialData]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    const reader = new FileReader();
    setError('');
    setIsReadingImage(true);
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, imageUrl: typeof reader.result === 'string' ? reader.result : prev.imageUrl }));
      setIsReadingImage(false);
    };
    reader.onerror = () => {
      setError('Unable to read the selected image file.');
      setIsReadingImage(false);
    };
    reader.readAsDataURL(file);
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

    setFormData(initialFormData);
    setSuccess(successMessage);
    window.setTimeout(() => {
      navigate('/resources');
    }, 900);
  };

  return (
    <section className="post-resource-wrap">
      <div className="section-head">
        <h2>{title}</h2>
        <p>
          {helperText}
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
            required
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
            required
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
            required
          />
        </label>
        <label>
          Image URL
          <input
            name="imageUrl"
            type="text"
            value={formData.imageUrl}
            onChange={handleChange}
            placeholder="https://example.com/resource-image.jpg"
          />
        </label>
        <label className="span-2">
          Upload Image
          <input type="file" accept="image/*" onChange={handleFileChange} />
          <span className="meta">Upload a local image or paste a hosted image URL.</span>
        </label>
        {formData.imageUrl ? (
          <div className="span-2 image-preview-card">
            <img src={formData.imageUrl} alt="Preview" className="image-preview" />
          </div>
        ) : null}
        <label className="span-2">
          Description
          <textarea
            name="description"
            rows="5"
            value={formData.description}
            onChange={handleChange}
            placeholder="Mention what is included and any usage notes."
            required
          />
        </label>
        {error && <p className="form-feedback form-error span-2">{error}</p>}
        {success && <p className="form-feedback form-success span-2">{success}</p>}
        <button className="btn btn-primary form-submit-btn" type="submit" disabled={isSubmitting || isReadingImage}>
          {isReadingImage ? 'Processing image...' : isSubmitting ? 'Saving...' : buttonText}
        </button>
      </form>
    </section>
  );
}

export default PostResourcePage;
