function IncomingRequestsPage({ requests, onAcceptRequest }) {
  return (
    <section>
      <div className="section-head">
        <h2>Incoming Borrow Requests</h2>
        <p>Review who requested your resources and accept one for the item you want to lend.</p>
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
                  <td>
                    <span
                      className={
                        request.status === 'Approved'
                          ? 'pill success'
                          : request.status === 'Pending'
                            ? 'pill warning'
                            : 'pill neutral'
                      }
                    >
                      {request.status}
                    </span>
                  </td>
                  <td>
                    {request.status === 'Pending' ? (
                      <button className="btn btn-primary btn-compact" type="button" onClick={() => onAcceptRequest(request)}>
                        Accept Request
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
