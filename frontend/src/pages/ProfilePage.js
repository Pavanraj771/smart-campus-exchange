import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

function formatActivityDate(value) {
  if (!value) {
    return 'Recently';
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return 'Recently';
  }

  return parsedDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function ProfilePage({ currentUser, resources, borrowRequests, incomingRequests, onUpdateProfile }) {
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileState, setProfileState] = useState({ error: '', success: '', loading: false });

  useEffect(() => {
    setDisplayName(currentUser?.displayName || '');
    setIsEditingProfile(false);
  }, [currentUser]);

  const myResources = resources.filter((resource) => resource.ownerEmail === currentUser?.email);
  const myBorrowedItems = borrowRequests.filter((request) => request.status === 'Approved');
  const returnedItems = borrowRequests.filter((request) => request.status === 'Returned');
  const pendingOutgoingRequests = borrowRequests.filter((request) => request.status === 'Pending');
  const approvedIncomingRequests = incomingRequests.filter((request) => request.status === 'Approved');
  const completedIncomingRequests = incomingRequests.filter((request) => request.status === 'Returned');

  const recentActivity = useMemo(
    () =>
      [
        ...myResources.map((resource) => ({
          id: `resource-${resource.id}`,
          date: resource.updatedAt || resource.createdAt,
          text: `Posted resource: ${resource.title}`,
          to: `/resources/${resource.id}`
        })),
        ...pendingOutgoingRequests.map((request) => ({
          id: `borrow-pending-${request.id}`,
          date: request.createdAt,
          text: `Sent borrow request for ${request.item}`,
          to: '/requests'
        })),
        ...myBorrowedItems.map((request) => ({
          id: `borrow-approved-${request.id}`,
          date: request.createdAt,
          text: `Borrow request approved for ${request.item}`,
          to: '/requests'
        })),
        ...returnedItems.map((request) => ({
          id: `borrow-returned-${request.id}`,
          date: request.completedAt || request.createdAt,
          text: `Returned borrow completed for ${request.item}`,
          to: '/requests'
        })),
        ...approvedIncomingRequests.map((request) => ({
          id: `incoming-approved-${request.id}`,
          date: request.createdAt,
          text: `Accepted request from ${request.requester} for ${request.item}`,
          to: '/incoming-requests'
        })),
        ...completedIncomingRequests.map((request) => ({
          id: `incoming-returned-${request.id}`,
          date: request.completedAt || request.createdAt,
          text: `Marked ${request.item} as returned`,
          to: '/incoming-requests'
        }))
      ]
        .sort((left, right) => new Date(right.date || 0) - new Date(left.date || 0))
        .slice(0, 6),
    [approvedIncomingRequests, completedIncomingRequests, myBorrowedItems, myResources, pendingOutgoingRequests, returnedItems]
  );

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileState({ error: '', success: '', loading: true });
    const result = await onUpdateProfile({ displayName });
    if (!result.ok) {
      setProfileState({ error: result.message, success: '', loading: false });
      return;
    }
    setProfileState({ error: '', success: 'Profile updated successfully.', loading: false });
    setIsEditingProfile(false);
  };

  return (
    <section className="profile-page-grid">
      <article className="profile-card">
        <div className="section-head-row">
          <div>
            <h2>Profile</h2>
            <p className="meta">{currentUser?.email}</p>
          </div>
          {!isEditingProfile ? (
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => {
                setProfileState({ error: '', success: '', loading: false });
                setDisplayName(currentUser?.displayName || '');
                setIsEditingProfile(true);
              }}
            >
              Edit Profile
            </button>
          ) : null}
        </div>
        <p>
          {myResources.length} listings posted | {myBorrowedItems.length} active borrows | {returnedItems.length} completed
          returns
        </p>
        {!isEditingProfile ? (
          <div className="profile-summary-list">
            <p>
              <strong>Name:</strong> {currentUser?.displayName || 'Campus Member'}
            </p>
            <p>
              <strong>Email:</strong> {currentUser?.email}
            </p>
          </div>
        ) : (
          <form className="stack-form" onSubmit={handleProfileSubmit}>
            <label>
              Display Name
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
            </label>
            {profileState.error ? <p className="form-feedback form-error">{profileState.error}</p> : null}
            {profileState.success ? <p className="form-feedback form-success">{profileState.success}</p> : null}
            <div className="table-actions">
              <button className="btn btn-primary" type="submit" disabled={profileState.loading}>
                {profileState.loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => {
                  setDisplayName(currentUser?.displayName || '');
                  setProfileState({ error: '', success: '', loading: false });
                  setIsEditingProfile(false);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
        {!isEditingProfile && profileState.success ? <p className="form-feedback form-success">{profileState.success}</p> : null}
      </article>
      <article className="profile-card">
        <h3>Recent Activity</h3>
        {recentActivity.length ? (
          <ul className="detail-list">
            {recentActivity.map((activity) => (
              <li key={activity.id}>
                <Link className="activity-link" to={activity.to}>
                  {activity.text}
                </Link>{' '}
                - <span className="meta">{formatActivityDate(activity.date)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="meta">No recent activity yet. Post a resource or send a borrow request to get started.</p>
        )}
      </article>
    </section>
  );
}

export default ProfilePage;
