import { useMemo, useState } from 'react';
import ResourceCard from '../components/ResourceCard';

const PAGE_SIZE = 6;

function ResourcesPage({ resources }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(resources.map((resource) => resource.category))).sort();
    return ['All', ...uniqueCategories];
  }, [resources]);

  const filteredResources = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    const filtered = resources.filter((resource) => {
      if (resource.availability !== 'Available') {
        return false;
      }

      const matchesCategory = category === 'All' || resource.category === category;
      const matchesSearch =
        !normalizedQuery ||
        [resource.title, resource.category, resource.owner, resource.department, resource.location, resource.description]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesCategory && matchesSearch;
    });

    return filtered.sort((left, right) => {
      if (sortBy === 'title') {
        return left.title.localeCompare(right.title);
      }
      if (sortBy === 'rating') {
        return right.rating - left.rating;
      }
      return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
    });
  }, [category, resources, searchTerm, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredResources.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedResources = filteredResources.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleFilterChange = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  return (
    <section>
      <div className="section-head">
        <h2>Resource Marketplace</h2>
        <p>Browse by category, owner, and availability.</p>
      </div>
      <div className="search-row search-grid-3">
        <input
          type="text"
          value={searchTerm}
          onChange={handleFilterChange(setSearchTerm)}
          placeholder="Search books, lab tools, electronics..."
        />
        <select value={category} onChange={handleFilterChange(setCategory)}>
          {categories.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select value={sortBy} onChange={handleFilterChange(setSortBy)}>
          <option value="newest">Newest First</option>
          <option value="title">Title A-Z</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>
      {paginatedResources.length ? (
        <>
          <div className="resource-grid">
            {paginatedResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
          <div className="pagination-row">
            <button className="btn btn-secondary btn-compact" type="button" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1}>
              Previous
            </button>
            <p className="meta">
              Page {currentPage} of {totalPages}
            </p>
            <button
              className="btn btn-secondary btn-compact"
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <h3>No matching resources</h3>
          <p>Try a different keyword or category filter.</p>
        </div>
      )}
    </section>
  );
}

export default ResourcesPage;
