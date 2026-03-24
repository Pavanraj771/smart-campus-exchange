import { Link } from 'react-router-dom';

function DashboardPage({ resources, borrowRequests, incomingRequests, notifications }) {
  const activeBorrows = borrowRequests.filter((request) => request.status === 'Approved').length;
  const pendingRequests = borrowRequests.filter((request) => request.status === 'Pending').length;
  const returnedRequests = borrowRequests.filter((request) => request.status === 'Returned').length;
  const activeLends = incomingRequests.filter((request) => request.status === 'Approved').length;
  const pendingIncoming = incomingRequests.filter((request) => request.status === 'Pending').length;
  const unreadNotifications = notifications.filter((notification) => !notification.isRead).length;

  return (
    <section className="panel-grid">
      <article className="panel">
        <h3>My Listings</h3>
        <p>{resources.length} resources posted</p>
      </article>
      <article className="panel">
        <h3>Borrowed Items</h3>
        <p>{activeBorrows} currently borrowed</p>
      </article>
      <article className="panel">
        <h3>My Requests</h3>
        <p>{pendingRequests} pending requests</p>
      </article>
      <article className="panel">
        <h3>Completed Borrows</h3>
        <p>{returnedRequests} returned requests</p>
      </article>
      <Link className="panel panel-link" to="/incoming-requests">
        <h3>Incoming Requests</h3>
        <p>{pendingIncoming} need your response</p>
      </Link>
      <Link className="panel panel-link" to="/my-resources">
        <h3>Resource Manager</h3>
        <p>{activeLends} resources currently lent out</p>
      </Link>
      <Link className="panel panel-link" to="/notifications">
        <h3>Notifications</h3>
        <p>{unreadNotifications} unread updates</p>
      </Link>
    </section>
  );
}

export default DashboardPage;
