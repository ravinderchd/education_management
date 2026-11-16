/**
 * EduManage – demo data seeder
 *
 *   npm run seed
 *
 * Creates demo login accounts (admin, faculty, students), courses, subjects,
 * attendance for the last few weeks, results and announcements.
 * Safe to run more than once (existing records are updated, not duplicated).
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("✗ Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
  process.exit(1);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

function check(error, step) {
  if (error) {
    console.error(`✗ ${step}: ${error.message}`);
    if (/relation .* does not exist|schema cache/i.test(error.message)) {
      console.error("  → Run supabase/schema.sql in the Supabase SQL Editor first.");
    }
    process.exit(1);
  }
}

// ---------------------------------------------------------------- data
const ADMIN = { name: "Admin User", email: "admin@edumanage.com", password: "Admin@123", role: "admin" };

const FACULTY = [
  { name: "Dr. Anil Mehta", email: "faculty@edumanage.com", password: "Faculty@123", department: "Computer Science", designation: "Associate Professor", phone: "9812345670" },
  { name: "Prof. Sunita Rao", email: "sunita@edumanage.com", password: "Faculty@123", department: "Management", designation: "Assistant Professor", phone: "9812345671" },
];

const COURSES = [
  { course_name: "BCA", duration_years: 3, description: "Bachelor of Computer Applications" },
  { course_name: "BBA", duration_years: 3, description: "Bachelor of Business Administration" },
  { course_name: "B.Tech", duration_years: 4, description: "Bachelor of Technology in Computer Science & Engineering" },
  { course_name: "MCA", duration_years: 2, description: "Master of Computer Applications" },
];

const SUBJECTS = {
  BCA: [
    [1, "BCA101", "Programming in C"],
    [1, "BCA102", "Mathematics I"],
    [1, "BCA103", "Communication Skills"],
    [2, "BCA201", "Data Structures"],
    [2, "BCA202", "Digital Electronics"],
    [3, "BCA301", "Object Oriented Programming with C++"],
    [3, "BCA302", "Operating Systems"],
    [4, "BCA401", "Database Management Systems"],
    [4, "BCA402", "Java Programming"],
    [4, "BCA403", "Computer Networks"],
    [4, "BCA404", "Software Engineering"],
  ],
  BBA: [
    [2, "BBA201", "Principles of Management"],
    [2, "BBA202", "Business Accounting"],
    [2, "BBA203", "Business Communication"],
  ],
  "B.Tech": [
    [3, "CS301", "Data Structures and Algorithms"],
    [3, "CS302", "Discrete Mathematics"],
    [3, "CS303", "Computer Organization"],
  ],
  MCA: [
    [1, "MCA101", "Advanced Java"],
    [1, "MCA102", "Web Technologies"],
    [1, "MCA103", "Design and Analysis of Algorithms"],
  ],
};

// attendanceRate = chance of being present (Aman is kept low to demo the 75% warning)
const STUDENTS = [
  { roll: "STU001", name: "Rahul Sharma", email: "rahul@edumanage.com", course: "BCA", semester: 4, phone: "9876543210", department: "Computer Science", rate: 0.92 },
  { roll: "STU002", name: "Aman Kumar", email: "aman@edumanage.com", course: "BCA", semester: 4, phone: "9876543211", department: "Computer Science", rate: 0.6 },
  { roll: "STU003", name: "Priya Verma", email: "priya@edumanage.com", course: "BCA", semester: 4, phone: "9876543212", department: "Computer Science", rate: 0.88 },
  { roll: "STU004", name: "Simran Kaur", email: "simran@edumanage.com", course: "BCA", semester: 4, phone: "9876543213", department: "Computer Science", rate: 0.95 },
  { roll: "STU005", name: "Rohan Mehta", email: "rohan@edumanage.com", course: "BCA", semester: 4, phone: "9876543214", department: "Computer Science", rate: 0.8 },
  { roll: "STU006", name: "Neha Gupta", email: "neha@edumanage.com", course: "BBA", semester: 2, phone: "9876543215", department: "Management", rate: 0.9 },
  { roll: "STU007", name: "Arjun Singh", email: "arjun@edumanage.com", course: "B.Tech", semester: 3, phone: "9876543216", department: "Computer Science & Engineering", rate: 0.85 },
  { roll: "STU008", name: "Kavya Iyer", email: "kavya@edumanage.com", course: "MCA", semester: 1, phone: "9876543217", department: "Computer Applications", rate: 0.93 },
];
const STUDENT_PASSWORD = "Student@123";

// Example marks from the project brief for Rahul; others are generated.
const FIXED_MARKS = {
  STU001: { BCA401: 78, BCA402: 85, BCA403: 82, BCA404: 90 },
};

const ANNOUNCEMENTS = [
  { title: "Mid-semester examination timetable announced", description: "The mid-semester examinations will start next Monday. The detailed timetable is available at the examination cell notice board.", audience: "all", daysAgo: 1 },
  { title: "Assignment submission deadline", description: "Java Programming assignment 2 must be submitted by Friday, 5:00 PM. Late submissions will not be accepted.", audience: "students", daysAgo: 3 },
  { title: "College holiday notification", description: "The college will remain closed on the coming Friday on account of a public holiday. Classes resume on Monday.", audience: "all", daysAgo: 6 },
  { title: "Internal assessment schedule", description: "Internal assessments for all semesters will be held in the last week of the month. Faculty members are requested to submit question papers by the 20th.", audience: "faculty", daysAgo: 9 },
];

// Small deterministic random generator so every run produces the same demo data
let seed = 42;
const random = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

function isoDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Last `count` weekdays before today (today is left free for a live demo). */
function pastWeekdays(count) {
  const days = [];
  for (let i = 1; days.length < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (d.getDay() !== 0 && d.getDay() !== 6) days.push(d.toISOString().slice(0, 10));
  }
  return days.reverse();
}

// ---------------------------------------------------------------- helpers
async function getExistingUsers() {
  const users = new Map();
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    check(error, "List users");
    data.users.forEach((u) => users.set(u.email, u.id));
    if (data.users.length < 1000) break;
  }
  return users;
}

async function ensureAccount(existing, { name, email, password, role }) {
  let id = existing.get(email);
  if (id) {
    const { error } = await db.auth.admin.updateUserById(id, { password, email_confirm: true, user_metadata: { name } });
    check(error, `Update ${email}`);
  } else {
    const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name } });
    check(error, `Create ${email}`);
    id = data.user.id;
  }
  const { error } = await db.from("profiles").upsert({ id, name, email, role });
  check(error, `Profile ${email}`);
  return id;
}

// ---------------------------------------------------------------- run
console.log("Seeding EduManage demo data…");
const existing = await getExistingUsers();

await ensureAccount(existing, ADMIN);
console.log("✓ Admin account");

for (const f of FACULTY) {
  const userId = await ensureAccount(existing, { ...f, role: "faculty" });
  const { error } = await db
    .from("faculty")
    .upsert({ user_id: userId, department: f.department, designation: f.designation, phone: f.phone }, { onConflict: "user_id" });
  check(error, `Faculty ${f.email}`);
}
console.log(`✓ ${FACULTY.length} faculty`);

const { data: courses, error: courseError } = await db.from("courses").upsert(COURSES, { onConflict: "course_name" }).select();
check(courseError, "Courses");
const courseId = Object.fromEntries(courses.map((c) => [c.course_name, c.id]));
console.log(`✓ ${courses.length} courses`);

const subjectRows = Object.entries(SUBJECTS).flatMap(([course, list]) =>
  list.map(([semester, code, name]) => ({ course_id: courseId[course], semester, subject_code: code, subject_name: name, max_marks: 100 }))
);
const { data: subjects, error: subjectError } = await db
  .from("subjects")
  .upsert(subjectRows, { onConflict: "course_id,semester,subject_name" })
  .select();
check(subjectError, "Subjects");
console.log(`✓ ${subjects.length} subjects`);

const students = [];
for (const s of STUDENTS) {
  const userId = await ensureAccount(existing, { name: s.name, email: s.email, password: STUDENT_PASSWORD, role: "student" });
  const { data, error } = await db
    .from("students")
    .upsert(
      { user_id: userId, roll_number: s.roll, course_id: courseId[s.course], semester: s.semester, phone: s.phone, department: s.department },
      { onConflict: "user_id" }
    )
    .select()
    .single();
  check(error, `Student ${s.roll}`);
  students.push({ ...s, id: data.id });
}
console.log(`✓ ${students.length} students`);

const { data: staff } = await db.from("profiles").select("id").eq("email", FACULTY[0].email).single();

// Attendance: last 12 weekdays for each student's current-semester subjects
const dates = pastWeekdays(12);
const attendanceRows = [];
for (const st of students) {
  const mySubjects = subjects.filter((sub) => sub.course_id === courseId[st.course] && sub.semester === st.semester);
  for (const sub of mySubjects) {
    for (const date of dates) {
      attendanceRows.push({
        student_id: st.id,
        subject_id: sub.id,
        date,
        status: random() < st.rate ? "present" : "absent",
        marked_by: staff?.id ?? null,
      });
    }
  }
}
const { error: attError } = await db.from("attendance").upsert(attendanceRows, { onConflict: "student_id,subject_id,date" });
check(attError, "Attendance");
console.log(`✓ ${attendanceRows.length} attendance records`);

// Results (published) using the grading rules from the database
const { data: rules } = await db.from("grading_rules").select("grade, min_percentage");
const gradeFor = (pct) =>
  [...rules].sort((a, b) => b.min_percentage - a.min_percentage).find((r) => pct >= Number(r.min_percentage))?.grade ?? "F";

const resultRows = [];
for (const st of students) {
  const mySubjects = subjects.filter((sub) => sub.course_id === courseId[st.course] && sub.semester === st.semester);
  for (const sub of mySubjects) {
    const marks = FIXED_MARKS[st.roll]?.[sub.subject_code] ?? Math.round(45 + random() * 50);
    resultRows.push({
      student_id: st.id,
      subject_id: sub.id,
      marks,
      total_marks: sub.max_marks,
      grade: gradeFor((marks / sub.max_marks) * 100),
      published: true,
      entered_by: staff?.id ?? null,
    });
  }
}
const { error: resError } = await db.from("results").upsert(resultRows, { onConflict: "student_id,subject_id" });
check(resError, "Results");
console.log(`✓ ${resultRows.length} results`);

// Announcements (only added once)
const { count } = await db.from("announcements").select("*", { count: "exact", head: true });
if (!count) {
  const { data: admin } = await db.from("profiles").select("id").eq("email", ADMIN.email).single();
  const { error } = await db.from("announcements").insert(
    ANNOUNCEMENTS.map(({ daysAgo, ...a }) => ({ ...a, date: isoDaysAgo(daysAgo), created_by: admin.id }))
  );
  check(error, "Announcements");
  console.log(`✓ ${ANNOUNCEMENTS.length} announcements`);
} else {
  console.log("• Announcements already exist – skipped");
}

console.log(`
Done! Demo accounts:
  Admin    admin@edumanage.com   / Admin@123
  Faculty  faculty@edumanage.com / Faculty@123
  Student  rahul@edumanage.com   / Student@123   (all demo students use Student@123)
`);
