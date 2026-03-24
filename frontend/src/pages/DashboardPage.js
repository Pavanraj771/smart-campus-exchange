import { Link } from 'react-router-dom';

function DashboardPage({ resources, borrowRequests, incomingRequests }) {
  return (
    <section className="panel-grid">
      <article className="panel">
        <h3>My Listings</h3>
        <p>{resources.length} active resources</p>
      </article>
      <article className="panel">
        <h3>Borrowed Items</h3>
        <p>{borrowRequests.filter((request) => request.status === 'Approved').length} currently borrowed</p>
      </article>
      <article className="panel">
        <h3>My Requests</h3>
        <p>{borrowRequests.filter((request) => request.status === 'Pending').length} pending requests</p>
      </article>
      <article className="panel">
        <h3>Reputation Score</h3>
        <p>4.8 / 5.0</p>
      </article>
      <Link className="panel panel-link" to="/incoming-requests">
        <h3>Incoming Requests</h3>
        <p>{incomingRequests.filter((request) => request.status === 'Pending').length} need your response</p>
      </Link>
    </section>
  );
}

export default DashboardPage;
