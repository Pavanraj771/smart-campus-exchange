function IncomingRequestsPage({
  requests,
  onAcceptRequest,
  onRejectRequest,
  onCompleteRequest,
  activeRequestId,
  activeAction
}) {
  return (
    <section>
      <div className="section-head">
        <h2>Incoming Borrow Requests</h2>
        <p>Review request details, accept one borrower, and mark the item returned when it comes back.</p>
      </div>
      {requests.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Resource</th>
                <th>Requester</th>
                <th>Email</th>
                <th>Duration</th>
                <th>Message</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>{request.id}</td>
                  <td>{request.item}</td>
                  <td>{request.requester}</td>
                  <td>{request.requesterEmail}</td>
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
                      <div className="table-actions">
                        <button
                          className="btn btn-primary btn-compact"
                          type="button"
                          onClick={() => onAcceptRequest(request)}
                          disabled={activeRequestId === request.id}
                        >
                          {activeRequestId === request.id && activeAction === 'accept' ? 'Accepting...' : 'Accept'}
                        </button>
                        <button
                          className="btn btn-secondary btn-compact"
                          type="button"
                          onClick={() => onRejectRequest(request)}
                          disabled={activeRequestId === request.id}
                        >
                          {activeRequestId === request.id && activeAction === 'reject' ? 'Rejecting...' : 'Reject'}
                        </button>
                      </div>
                    ) : request.status === 'Approved' ? (
                      <button
                        className="btn btn-secondary btn-compact"
                        type="button"
                        onClick={() => onCompleteRequest(request)}
                        disabled={activeRequestId === request.id}
                      >
                        {activeRequestId === request.id && activeAction === 'complete' ? 'Updating...' : 'Mark Returned'}
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
          <h3>No incoming requests</h3>
          <p>Requests for resources you post will appear here.</p>
        </div>
      )}
    </section>
  );
}

export default IncomingRequestsPage;
