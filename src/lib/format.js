/** Small display helpers. */

export function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export function formatDate(value) {
  if (!value) return "-";
  // Dates from Postgres "date" columns look like "2026-11-16"; parse as local date.
  const d = typeof value === "string" && value.length === 10 ? new Date(value + "T00:00:00") : new Date(value);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** Today's date as YYYY-MM-DD in the user's local time zone. */
export function todayISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

/** The date `days` days ago as YYYY-MM-DD. */
export function daysAgoISO(days) {
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
}

export const ROLE_LABELS = { admin: "Administrator", faculty: "Faculty", student: "Student" };

export const AUDIENCE_LABELS = { all: "Everyone", students: "Students", faculty: "Faculty" };
