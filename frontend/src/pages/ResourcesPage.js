import { useMemo, useState } from 'react';
import ResourceCard from '../components/ResourceCard';

function ResourcesPage({ resources }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All');

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(resources.map((resource) => resource.category))).sort();
    return ['All', ...uniqueCategories];
  }, [resources]);

  const filteredResources = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    return resources.filter((resource) => {
      if (resource.availability !== 'Available') {
        return false;
      }

      const matchesCategory = category === 'All' || resource.category === category;
      const matchesSearch =
        !normalizedQuery ||
        [resource.title, resource.category, resource.owner, resource.department, resource.location]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesCategory && matchesSearch;
    });
  }, [category, resources, searchTerm]);

  return (
    <section>
      <div className="section-head">
        <h2>Resource Marketplace</h2>
        <p>Browse by category, owner, and availability.</p>
      </div>
      <div className="search-row">
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search books, lab tools, electronics..."
        />
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          {categories.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      {filteredResources.length ? (
        <div className="resource-grid">
          {filteredResources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
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
