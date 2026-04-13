import { formatDate } from "../utils/formatters";
import StatusBadge from "./StatusBadge";

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const ApplicationsTable = ({ applications, onEdit, onDelete, onStatusChange }) => {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Application tracker</p>
          <h2>Everything in your pipeline</h2>
        </div>
      </div>

      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Role</th>
              <th>Status</th>
              <th>Applied</th>
              <th>Next step</th>
              <th>Portfolio</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {applications.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-cell">
                  No applications yet. Add your first internship above.
                </td>
              </tr>
            ) : null}

            {applications.map((application) => {
              // Bug #4: Only pick stages whose date is today or in the future,
              // then take the soonest one (sorted ascending by date).
              const upcomingStages = (application.interviewStages || [])
                .filter((stage) => stage.date && new Date(stage.date) >= TODAY)
                .sort((a, b) => new Date(a.date) - new Date(b.date));
              const nextStage = upcomingStages[0] || null;

              return (
                <tr key={application._id}>
                  <td>
                    <strong>{application.companyName}</strong>
                    <span>{application.roleType}</span>
                  </td>
                  <td>{application.role}</td>
                  <td>
                    <StatusBadge 
                      status={application.status} 
                      onChange={(newStatus) => onStatusChange(application._id, newStatus)} 
                    />
                  </td>
                  <td>{formatDate(application.appliedDate)}</td>
                  <td>{nextStage ? `${nextStage.round} · ${formatDate(nextStage.date)}` : "No upcoming stage"}</td>
                  <td>{application.portfolioViewed ? "Viewed" : "Not viewed"}</td>
                  <td className="action-row">
                    <button type="button" className="ghost-button" onClick={() => onEdit(application)}>
                      Edit
                    </button>
                    <button type="button" className="ghost-button danger-button" onClick={() => onDelete(application._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ApplicationsTable;
