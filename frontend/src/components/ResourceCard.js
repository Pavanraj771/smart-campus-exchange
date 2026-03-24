import { Link } from 'react-router-dom';

const fallbackImage = 'https://placehold.co/900x600/e9efe8/1f3b3a?text=Resource+Image';

function ResourceCard({ resource }) {
  return (
    <article className="resource-card">
      <img
        src={resource.image}
        alt={resource.title}
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = fallbackImage;
        }}
      />
      <div className="resource-body">
        <p className="tag">{resource.category}</p>
        <h3>{resource.title}</h3>
        <p className="meta">
          {resource.owner} - {resource.department}
        </p>
        <p>{resource.description}</p>
        <div className="card-footer">
          <span className={resource.availability === 'Available' ? 'pill success' : 'pill warning'}>
            {resource.availability}
          </span>
          <Link className="text-link" to={`/resources/${resource.id}`}>
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}

export default ResourceCard;
