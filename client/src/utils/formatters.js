
// Bug #14: Date strings like "2024-04-01" are parsed as midnight UTC by the Date
// constructor, which causes them to appear as the previous day in UTC+ timezones
// (e.g. UTC+5:30 sees "Mar 31"). We detect date-only strings and force UTC parsing.
export const formatDate = (value) => {
  if (!value) {
    return "Not set";
  }

  // ISO date-only: "YYYY-MM-DD" — parse with explicit UTC midnight to avoid timezone shift
  const date =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00Z`)
      : new Date(value);

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeZone: "UTC"
  }).format(date);
};
