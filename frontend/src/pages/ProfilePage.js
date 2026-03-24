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

function ProfilePage({ currentUser, resources, borrowRequests, incomingRequests }) {
  const displayName = currentUser?.displayName || 'Student User';
  const myResources = resources.filter((resource) => resource.ownerEmail === currentUser?.email);
  const myBorrowedItems = borrowRequests.filter((request) => request.status === 'Approved');
  const pendingOutgoingRequests = borrowRequests.filter((request) => request.status === 'Pending');
  const approvedIncomingRequests = incomingRequests.filter((request) => request.status === 'Approved');

  const recentActivity = [
    ...myResources.map((resource) => ({
      id: `resource-${resource.id}`,
      date: resource.createdAt,
      text: `Posted resource: ${resource.title}`
    })),
    ...pendingOutgoingRequests.map((request) => ({
      id: `borrow-pending-${request.id}`,
      date: request.createdAt,
      text: `Sent borrow request for ${request.item}`
    })),
    ...myBorrowedItems.map((request) => ({
      id: `borrow-approved-${request.id}`,
      date: request.createdAt,
      text: `Borrow request approved for ${request.item}`
    })),
    ...approvedIncomingRequests.map((request) => ({
      id: `incoming-approved-${request.id}`,
      date: request.createdAt,
      text: `Accepted request from ${request.requester} for ${request.item}`
    }))
  ]
    .sort((left, right) => new Date(right.date || 0) - new Date(left.date || 0))
    .slice(0, 5);

  return (
    <section className="profile-layout">
      <article className="profile-card">
        <h2>Profile</h2>
        <p className="meta">{displayName || 'Student User'} - Campus Member</p>
        <p>{currentUser?.email}</p>
        <p>
          {myResources.length} listings posted | {myBorrowedItems.length} approved borrows | Reputation 4.8/5
        </p>
      </article>
      <article className="profile-card">
        <h3>Recent Activity</h3>
        {recentActivity.length ? (
          <ul className="detail-list">
            {recentActivity.map((activity) => (
              <li key={activity.id}>
                {activity.text} - <span className="meta">{formatActivityDate(activity.date)}</span>
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
