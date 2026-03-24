import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const fallbackImage = 'https://placehold.co/900x600/e9efe8/1f3b3a?text=Resource+Image';

function ResourceDetailPage({ resources, currentUser, onDeleteResource, onBorrowResource }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [borrowMessage, setBorrowMessage] = useState('');
  const [borrowError, setBorrowError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const resource = resources.find((entry) => String(entry.id) === id);

  const canDelete = Boolean(currentUser && resource?.ownerEmail && resource.ownerEmail === currentUser.email);

  if (!resource) {
    return (
      <section className="empty-state">
        <h2>Resource not found</h2>
        <button className="btn btn-primary" type="button" onClick={() => navigate('/resources')}>
          Back to Resources
        </button>
      </section>
    );
  }

  const handleDelete = async () => {
    setDeleteError('');
    const result = await onDeleteResource(resource.id);
    if (!result.ok) {
      setDeleteError(result.message);
      return;
    }

    setIsDeleteModalOpen(false);
    navigate('/resources');
  };

  const handleBorrow = async () => {
    setBorrowError('');
    setBorrowMessage('');
    const result = await onBorrowResource(resource.id);
    if (!result.ok) {
      setBorrowError(result.message);
      return;
    }

    setBorrowMessage(result.message);
  };

  return (
    <section className="detail-layout">
      <img
        src={resource.image}
        alt={resource.title}
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = fallbackImage;
        }}
      />
      <div>
        <p className="tag">{resource.category}</p>
        <h2>{resource.title}</h2>
        <p>{resource.description}</p>
        <ul className="detail-list">
          <li>Owner: {resource.owner}</li>
          <li>Department: {resource.department}</li>
          <li>Condition: {resource.condition}</li>
          <li>Pickup: {resource.location}</li>
          <li>Rating: {resource.rating} / 5</li>
        </ul>
        {borrowError && <p className="form-feedback form-error">{borrowError}</p>}
        {borrowMessage && <p className="form-feedback form-success">{borrowMessage}</p>}
        {deleteError && <p className="form-feedback form-error">{deleteError}</p>}
        <div className="cta-row">
          {!canDelete ? (
            <button
              className="btn btn-primary"
              type="button"
              onClick={handleBorrow}
              disabled={resource.availability !== 'Available'}
            >
              {resource.availability === 'Available' ? 'Send Borrow Request' : 'Currently Unavailable'}
            </button>
          ) : null}
          {canDelete ? (
            <button className="btn btn-danger" type="button" onClick={() => setIsDeleteModalOpen(true)}>
              Delete Resource
            </button>
          ) : null}
          <button className="btn btn-secondary" type="button" onClick={() => navigate('/resources')}>
            Back
          </button>
        </div>
      </div>
      {isDeleteModalOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setIsDeleteModalOpen(false)}>
          <div
            className="confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="eyebrow">Confirm action</p>
            <h2 id="delete-modal-title">Delete this resource?</h2>
            <p className="confirm-modal-text">
              <strong>{resource.title}</strong> will be removed from the marketplace and this cannot be undone.
            </p>
            <div className="confirm-modal-actions">
              <button className="btn btn-secondary" type="button" onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" type="button" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default ResourceDetailPage;
