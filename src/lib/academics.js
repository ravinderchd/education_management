/**
 * Academic calculations used by both the server and the browser.
 * Kept in one small file so they are easy to find and explain.
 */

/** Attendance % = (Present classes / Total classes) × 100, rounded to 1 decimal. */
export function attendancePercentage(present, total) {
  if (!total) return 0;
  return Math.round((present / total) * 1000) / 10;
}

/** Students below this attendance % are highlighted as "at risk". */
export const MIN_ATTENDANCE = 75;

/**
 * Groups attendance rows by subject.
 * records: [{ subject_id, status }] → { [subject_id]: { present, total, percentage } }
 */
export function summarizeAttendance(records, key = "subject_id") {
  const summary = {};
  for (const r of records) {
    const id = r[key];
    summary[id] ??= { present: 0, total: 0, percentage: 0 };
    summary[id].total += 1;
    if (r.status === "present") summary[id].present += 1;
  }
  for (const id in summary) {
    summary[id].percentage = attendancePercentage(summary[id].present, summary[id].total);
  }
  return summary;
}

/** Overall attendance across a list of attendance rows. */
export function overallAttendance(records) {
  const present = records.filter((r) => r.status === "present").length;
  return { present, total: records.length, percentage: attendancePercentage(present, records.length) };
}

/** Marks → percentage, rounded to 2 decimals. */
export function marksPercentage(marks, totalMarks) {
  if (!totalMarks) return 0;
  return Math.round((Number(marks) / Number(totalMarks)) * 10000) / 100;
}

/**
 * Configurable grading: rules come from the grading_rules table,
 * e.g. [{ grade: "A+", min_percentage: 90 }, ..., { grade: "F", min_percentage: 0 }].
 * The student gets the grade of the highest rule whose minimum they reached.
 */
export function calculateGrade(percentage, rules) {
  const sorted = [...rules].sort((a, b) => Number(b.min_percentage) - Number(a.min_percentage));
  const rule = sorted.find((r) => percentage >= Number(r.min_percentage));
  return rule ? rule.grade : "F";
}

/** Totals for a list of results rows [{ marks, total_marks }]. */
export function summarizeResults(results, rules) {
  const obtained = results.reduce((sum, r) => sum + Number(r.marks), 0);
  const maximum = results.reduce((sum, r) => sum + Number(r.total_marks), 0);
  const percentage = marksPercentage(obtained, maximum);
  return {
    obtained,
    maximum,
    percentage,
    grade: results.length ? calculateGrade(percentage, rules) : "-",
  };
}

/** Number of semesters in a course. */
export function semestersFor(course) {
  return (course?.duration_years || 0) * 2;
}

/** Turns Supabase/Postgres errors into friendly messages. */
export function friendlyDbError(error) {
  if (!error) return "Something went wrong.";
  const msg = error.message || "";
  if (error.code === "23505") {
    if (msg.includes("roll_number")) return "A student with this roll number already exists.";
    if (msg.includes("email")) return "This email address is already in use.";
    if (msg.includes("course_name")) return "A course with this name already exists.";
    if (msg.includes("attendance")) return "Attendance is already recorded for this student, subject and date.";
    if (msg.includes("grading_rules")) return "Each grade and each minimum percentage must be unique.";
    return "This record already exists.";
  }
  if (error.code === "23503") {
    if (msg.includes("students_course_id_fkey")) return "This course still has students enrolled. Move or delete them first.";
    return "This record is linked to other records and can't be deleted.";
  }
  if (error.code === "23514") return "One of the values is not allowed (check limits such as maximum marks).";
  if (error.code === "42501") return "You do not have permission to do this.";
  return msg || "Something went wrong.";
}
