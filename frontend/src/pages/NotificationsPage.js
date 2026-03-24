import { Link } from 'react-router-dom';

function formatDate(value) {
  if (!value) {
    return 'Just now';
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return 'Just now';
  }

  return parsedDate.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function NotificationsPage({ notifications, onMarkRead, onMarkAllRead, activeNotificationId }) {
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return (
    <section>
      <div className="section-head section-head-row">
        <div>
          <h2>Notifications</h2>
          <p>Track borrow updates, profile changes, and resource activity.</p>
        </div>
        <button className="btn btn-secondary" type="button" onClick={onMarkAllRead} disabled={!unreadCount}>
          Mark All Read
        </button>
      </div>
      {notifications.length ? (
        <div className="notification-list">
          {notifications.map((notification) => (
            <article
              key={notification.id}
              className={`notification-card${notification.isRead ? '' : ' notification-card-unread'}`}
            >
              <div>
                <div className="notification-title-row">
                  <h3>{notification.title}</h3>
                  {!notification.isRead ? <span className="pill warning">New</span> : null}
                </div>
                <p>{notification.message}</p>
                <p className="meta">{formatDate(notification.createdAt)}</p>
              </div>
              <div className="notification-actions">
                {notification.link ? (
                  <Link className="btn btn-secondary btn-compact" to={notification.link}>
                    Open
                  </Link>
                ) : null}
                {!notification.isRead ? (
                  <button
                    className="btn btn-primary btn-compact"
                    type="button"
                    onClick={() => onMarkRead(notification.id)}
                    disabled={activeNotificationId === notification.id}
                  >
                    {activeNotificationId === notification.id ? 'Updating...' : 'Mark Read'}
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>No notifications yet</h3>
          <p>Borrow and resource updates will appear here.</p>
        </div>
      )}
    </section>
  );
}

export default NotificationsPage;
