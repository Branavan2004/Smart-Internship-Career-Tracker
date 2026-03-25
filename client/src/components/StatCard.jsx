const StatCard = ({ label, value, accent }) => {
  return (
    <article className="stat-card">
      <span className="stat-accent" style={{ background: accent }} />
      <p>{label}</p>
      <h3>{value}</h3>
    </article>
  );
};

export default StatCard;
