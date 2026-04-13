import { statusOptions } from "../utils/constants";

const statusClassMap = {
  Pending: "badge badge-pending",
  Interviewed: "badge badge-interviewed",
  Accepted: "badge badge-accepted",
  Rejected: "badge badge-rejected",
  Offer: "badge badge-offer"
};

const StatusBadge = ({ status, onChange }) => {
  if (!onChange) {
    return <span className={statusClassMap[status] || "badge"}>{status}</span>;
  }

  return (
    <select 
      className={statusClassMap[status] || "badge"}
      value={status} 
      onChange={(e) => onChange(e.target.value)}
      style={{
        border: 'none',
        cursor: 'pointer',
        fontWeight: 600,
        appearance: 'none',
        textAlign: 'center',
        width: 'auto',
        marginTop: 0,
        padding: '0.35rem 1rem 0.35rem 0.75rem'
      }}
    >
      {statusOptions.map(option => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  );
};

export default StatusBadge;
