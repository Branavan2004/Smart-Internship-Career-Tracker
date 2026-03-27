import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";
import { formatDate } from "../utils/formatters";

const ReviewQueuePage = () => {
  const [applications, setApplications] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadReviewQueue = async () => {
      try {
        const response = await apiClient.get("/review");
        setApplications(response.data.applications);
      } catch (error) {
        setMessage(error.response?.data?.message || "Could not load review queue.");
      }
    };

    loadReviewQueue();
  }, []);

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Reviewer</p>
          <h2>Application review queue</h2>
          <p>Reviewers can inspect applications that are pending or already in interview stages.</p>
        </div>
      </section>

      {message ? <p className="error-text">{message}</p> : null}

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Queue</p>
            <h2>{applications.length} application(s) available for review</h2>
          </div>
        </div>

        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Company</th>
                <th>Role</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-cell">
                    No applications are waiting for review right now.
                  </td>
                </tr>
              ) : null}

              {applications.map((application) => (
                <tr key={application._id}>
                  <td>
                    <strong>{application.user?.name || "Unknown user"}</strong>
                    <span>{application.user?.email || "No email"}</span>
                  </td>
                  <td>{application.companyName}</td>
                  <td>{application.role}</td>
                  <td>{application.status}</td>
                  <td>{formatDate(application.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ReviewQueuePage;
