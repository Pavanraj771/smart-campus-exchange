import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <section className="hero">
      <div>
        <span className="eyebrow">Campus community platform</span>
        <h2>Find what you need. Lend what you can.</h2>
        <p>
          One place for books, lab tools, electronics, and student essentials. Track borrow requests,
          ratings, and active exchanges with clarity.
        </p>
        <div className="cta-row">
          <Link className="btn btn-primary" to="/resources">
            Explore Resources
          </Link>
          <Link className="btn btn-secondary" to="/post-resource">
            Post a Resource
          </Link>
        </div>
      </div>
      <div className="stats-panel">
        <article>
          <h3>480+</h3>
          <p>Active resources listed this semester</p>
        </article>
        <article>
          <h3>1,340</h3>
          <p>Successful borrows with 4.7 average rating</p>
        </article>
        <article>
          <h3>22</h3>
          <p>Departments collaborating on shared inventory</p>
        </article>
      </div>
    </section>
  );
}

export default HomePage;
