const StatCard = ({ label, value, accent, isEmpty }) => {
  return (
    <article className={`stat-card ${isEmpty ? "empty-stat" : ""}`} style={isEmpty ? { opacity: 0.6, filter: 'grayscale(0.4)' } : {}}>
      <span className="stat-accent" style={{ background: accent }} />
      <p>{label}</p>
      <h3>{isEmpty ? "--" : value}</h3>
    </article>
  );
};

export default StatCard;
