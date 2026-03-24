import { NavLink } from 'react-router-dom';

const guestNavItems = [
  { to: '/', label: 'Home' },
  { to: '/resources', label: 'Resources' }
];

const userNavItems = [
  { to: '/', label: 'Home' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/resources', label: 'Resources' },
  { to: '/requests', label: 'Requests' },
  { to: '/my-resources', label: 'My Items' },
  { to: '/post-resource', label: 'Post Item' }
];

function AppShell({ children, currentUser, onLogout, theme, onToggleTheme, unreadNotifications }) {
  const navItems = currentUser ? userNavItems : guestNavItems;

  return (
    <div className="app-shell">
      <header className="site-header">
        <button
          className="theme-toggle"
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          <span className="theme-toggle-icon" aria-hidden="true">
            {theme === 'dark' ? '\u2600' : '\u263D'}
          </span>
        </button>
        <div className="brand-wrap">
          <span className="brand-dot" aria-hidden="true" />
          <div className="brand-content">
            <h1>Smart Campus Resource Exchange</h1>
            <div className="brand-marquee-box" aria-label="Platform message">
              <p className="brand-marquee-text">Share, borrow, and exchange campus resources with trust.</p>
            </div>
          </div>
        </div>
        <div className="site-nav-row">
          <div className="nav-logo">
            <img src="/nitwlogo.png" alt="NITW" />
          </div>
          <nav className="site-nav" aria-label="Primary">
            <div className="site-nav-links">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.to === '/'}>
                  {item.label}
                </NavLink>
              ))}
            </div>
            <div className="site-nav-actions">
              {currentUser ? (
                <>
                  <NavLink to="/notifications" className="nav-notification-link">
                    Notifications
                    {unreadNotifications ? <span className="nav-badge">{unreadNotifications}</span> : null}
                  </NavLink>
                  <NavLink to="/profile">Profile</NavLink>
                  <button className="nav-button" type="button" onClick={onLogout}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/login">Login</NavLink>
                  <NavLink to="/register">Signup</NavLink>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

export default AppShell;
