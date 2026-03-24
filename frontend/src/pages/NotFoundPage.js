import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <section className="empty-state">
      <h2>Page not found</h2>
      <Link className="btn btn-primary" to="/">
        Go Home
      </Link>
    </section>
  );
}

export default NotFoundPage;
