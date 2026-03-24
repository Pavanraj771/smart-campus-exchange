import { Link } from 'react-router-dom';

function MyResourcesPage({ resources }) {
  return (
    <section>
      <div className="section-head">
        <h2>My Resources</h2>
        <p>Manage your listings, availability, and edits in one place.</p>
      </div>
      {resources.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Location</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((resource) => (
                <tr key={resource.id}>
                  <td>{resource.title}</td>
                  <td>{resource.category}</td>
                  <td>{resource.location}</td>
                  <td>
                    <span className={resource.availability === 'Available' ? 'pill success' : 'pill warning'}>
                      {resource.availability}
                    </span>
                  </td>
                  <td>{new Date(resource.updatedAt || resource.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>
                    <div className="table-actions">
                      <Link className="btn btn-secondary btn-compact" to={`/resources/${resource.id}`}>
                        View
                      </Link>
                      <Link className="btn btn-primary btn-compact" to={`/resources/${resource.id}/edit`}>
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <h3>No resources posted yet</h3>
          <p>Create your first listing to start lending on campus.</p>
        </div>
      )}
    </section>
  );
}

export default MyResourcesPage;
