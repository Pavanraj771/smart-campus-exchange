function RequestsPage({ requests, currentUser, onCancelRequest, activeRequestId }) {
  const visibleRequests = currentUser
    ? requests.filter((request) => !request.requesterEmail || request.requesterEmail === currentUser.email)
    : requests;

  return (
    <section>
      <div className="section-head">
        <h2>Borrow Requests</h2>
        <p>Track your outgoing requests, duration, and return status.</p>
      </div>
      {visibleRequests.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Item</th>
                <th>Owner Reply</th>
                <th>Duration</th>
                <th>Message</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleRequests.map((request) => (
                <tr key={request.id}>
                  <td>{request.id}</td>
                  <td>{request.item}</td>
                  <td>{request.status === 'Pending' ? 'Waiting for owner' : 'Updated'}</td>
                  <td>{request.duration}</td>
                  <td>{request.message || <span className="meta">No message</span>}</td>
                  <td>
                    <span
                      className={
                        request.status === 'Approved'
                          ? 'pill success'
                          : request.status === 'Pending'
                            ? 'pill warning'
                            : request.status === 'Returned'
                              ? 'pill success'
                              : 'pill neutral'
                      }
                    >
                      {request.status}
                    </span>
                  </td>
                  <td>
                    {request.status === 'Pending' ? (
                      <button
                        className="btn btn-secondary btn-compact"
                        type="button"
                        onClick={() => onCancelRequest(request)}
                        disabled={activeRequestId === request.id}
                      >
                        {activeRequestId === request.id ? 'Cancelling...' : 'Cancel Request'}
                      </button>
                    ) : (
                      <span className="meta">No action</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <h3>No borrow requests yet</h3>
          <p>Your new requests will appear here.</p>
        </div>
      )}
    </section>
  );
}

export default RequestsPage;
