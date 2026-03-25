const statusClassMap = {
  Pending: "badge badge-pending",
  Interviewed: "badge badge-interviewed",
  Accepted: "badge badge-accepted",
  Rejected: "badge badge-rejected",
  Offer: "badge badge-offer"
};

const StatusBadge = ({ status }) => {
  return <span className={statusClassMap[status] || "badge"}>{status}</span>;
};

export default StatusBadge;
