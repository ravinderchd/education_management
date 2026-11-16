# EduManage – Education Management Software

A simple web application for managing **students, courses, subjects, attendance, examination results and announcements**, with separate portals for **Admin / Faculty** and **Students**.

| Layer | Technology |
|---|---|
| Frontend + server | **Next.js 16** (App Router, JavaScript, React 19) |
| Styling | **Tailwind CSS 4**, Inter font, Lucide icons |
| Database | **Supabase** (PostgreSQL) |
| Authentication | **Supabase Auth** – bcrypt password hashing + JWT session cookies |
| Authorisation | Role checks in Next.js **and** Row Level Security (RLS) in PostgreSQL |
| Charts | Recharts |

---

## 1. Setup

**Requirements:** Node.js 20+ and a free Supabase project (https://supabase.com).

```bash
npm install
cp .env.example .env.local      # then fill in the values (see below)
```

`.env.local` values come from **Supabase Dashboard → Project Settings → API Keys**:

| Variable | What it is |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable (anon) key – safe in the browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret (service_role) key – **server only**, used to create login accounts |
| `SUPABASE_DB_URL` | *(optional)* Postgres connection string, only for `npm run db:setup` |

**Create the database** – either:
- open **Supabase → SQL Editor**, paste [`supabase/schema.sql`](supabase/schema.sql) and click **Run**, or
- run `npm run db:setup` (needs `SUPABASE_DB_URL`).

⚠️ The schema script drops and recreates the EduManage tables, so running it again deletes their data.

**Load demo data and start:**

```bash
npm run seed     # demo accounts, courses, subjects, attendance, results, announcements
npm run dev      # http://localhost:3000
```

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@edumanage.com | Admin@123 |
| Faculty | faculty@edumanage.com | Faculty@123 |
| Student | rahul@edumanage.com | Student@123 |

Other demo students: aman, priya, simran, rohan, neha, arjun, kavya (`@edumanage.com`, password `Student@123`).
Aman's attendance is deliberately low, so the 75% warning shows up.

> In Supabase → Authentication → Sign In / Providers, turn **off "Allow new users to sign up"**. Accounts are created by the admin only.

---

## 2. Screens

| # | Screen | URL | Who |
|---|---|---|---|
| 1 | Login | `/login` | everyone |
| 2 | Admin dashboard – stats, charts, recent registrations, announcements | `/admin` | admin, faculty |
| 3 | Student management – search, filter, add / edit / delete, details | `/admin/students` | admin (faculty: view) |
| 4 | Faculty management | `/admin/faculty` | admin |
| 5 | Course management | `/admin/courses` | admin (faculty: view) |
| 6 | Subject management | `/admin/subjects` | admin (faculty: view) |
| 7 | Attendance – course → semester → subject → date → Present/Absent | `/admin/attendance` | admin, faculty |
| 8 | Examination & results – marks, % and grade, publish, grading rules | `/admin/results` | admin, faculty |
| 9 | Announcements – create / delete | `/admin/announcements` | admin, faculty |
| 10 | Student portal – dashboard, profile, courses, attendance, results, announcements | `/student/...` | student |

---

## 3. Project structure

```
edumanage/
├── supabase/schema.sql          ← tables, constraints, security policies, grading rules
├── scripts/
│   ├── seed.mjs                 ← demo data (npm run seed)
│   └── setup-db.mjs             ← runs schema.sql (npm run db:setup)
└── src/
    ├── proxy.js                 ← runs before each request: refresh session, block logged-out users
    ├── lib/
    │   ├── supabase/server.js   ← Supabase client acting as the logged-in user (RLS applies)
    │   ├── supabase/admin.js    ← service-role client (server only, account creation)
    │   ├── auth.js              ← getSession(), requireRole()
    │   ├── accounts.js          ← create / update / delete login accounts
    │   ├── academics.js         ← attendance %, grade and result calculations
    │   ├── actions/auth.js      ← login / logout Server Actions
    │   └── validation.js, format.js, student.js
    ├── components/
    │   ├── layout/DashboardShell.jsx   ← sidebar + header
    │   ├── ui/                  ← Modal, ConfirmDialog, Toast, StatCard, …
    │   ├── academic/            ← filters, attendance & results tables
    │   └── charts/BarChartCard.jsx
    └── app/                     ← one folder per screen
        ├── login/
        ├── admin/               ← page.js (read data) + actions.js (save data) + *Manager.jsx (UI)
        │   ├── students/ faculty/ courses/ subjects/
        │   └── attendance/ results/ announcements/
        └── student/             ← profile/ courses/ attendance/ results/ announcements/
```

Every admin screen follows the same pattern:

- **`page.js`** – a *Server Component*. It runs on the server, reads data from Supabase and passes it to the UI.
- **`*Manager.jsx` / `*Sheet.jsx`** – a *Client Component* (`"use client"`) for searching, forms, modals and buttons.
- **`actions.js`** – *Server Actions* (`"use server"`). The browser calls these to save changes. Each one checks the user's role, validates the input, writes to Supabase and returns `{ ok, message }` or `{ ok: false, error }`, which is shown as a toast.

---

## 4. How it works (viva notes)

### How the frontend talks to the backend
There is no separate Express server. Next.js is the backend too:
1. **Reading:** the browser requests `/admin/students` → the server-side `page.js` queries Supabase → HTML is sent back.
2. **Writing:** the form calls a Server Action such as `saveStudent(formData)` → it runs on the server → Supabase → `revalidatePath()` refreshes the page with the new data.

### How data is stored
Supabase runs PostgreSQL. The tables are in `supabase/schema.sql`:

```
auth.users (Supabase) 1──1 profiles (name, email, role)
profiles 1──1 students ──► courses 1──* subjects
profiles 1──1 faculty
students 1──* attendance *──1 subjects     UNIQUE(student_id, subject_id, date)
students 1──* results    *──1 subjects     UNIQUE(student_id, subject_id), CHECK(marks <= total_marks)
grading_rules (grade, min_percentage)
announcements (title, description, audience, date, created_by)
```

Business rules enforced by the **database itself**:
- duplicate roll numbers are blocked by `UNIQUE (roll_number)`
- duplicate attendance is blocked by `UNIQUE (student_id, subject_id, date)`. Saving the same class again updates the existing rows (upsert).
- marks above the maximum are blocked by `CHECK (marks <= total_marks)`. They are also checked in the form and in the Server Action.

### How login and roles work
1. Login form → `login` Server Action → `supabase.auth.signInWithPassword()`.
2. Supabase compares the password with its **bcrypt hash** and returns a **JWT**, stored in an HTTP-only cookie.
3. The role (`admin` / `faculty` / `student`) is read from `profiles` and the user is redirected to `/admin` or `/student`.
4. Protection works at three levels:
   - `proxy.js` sends logged-out visitors to `/login`
   - `requireRole()` in each layout, page and Server Action blocks the wrong role (a student opening `/admin` is sent to `/student`)
   - **Row Level Security** policies in PostgreSQL. Even if someone calls the API directly, a student can only read their own student row, attendance and *published* results.

### How attendance % is calculated
`src/lib/academics.js`:

```
Attendance % = (Present classes ÷ Total classes) × 100
```
It is calculated per subject and overall. Below 75% shows in red, with a warning on the student dashboard.

### How results are generated
1. Faculty choose course → semester → subject and enter marks (0 – maximum marks).
2. `Percentage = marks ÷ max marks × 100`.
3. The grade comes from the **configurable `grading_rules` table**: the highest grade whose minimum percentage was reached (default A+ ≥ 90, A ≥ 80, B+ ≥ 70, B ≥ 60, C ≥ 50, D ≥ 40, F ≥ 0). The admin can edit the rules on the Results page, and every existing result is then re-graded.
4. *Save as draft* keeps results hidden. *Save & publish* makes them visible to the student. The overall total, percentage and grade are calculated from all of the student's subjects.

---

## 5. Deploying to Vercel

1. Push the project to GitHub. `.env.local` is git-ignored, so your keys are never uploaded.
2. On https://vercel.com: **Add New → Project → Import** the GitHub repository. Vercel detects Next.js automatically.
3. Under **Settings → Environment Variables**, add the same values as in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

   `SUPABASE_DB_URL` is only needed on your own computer.
4. Click **Deploy**. Every later `git push` to `main` redeploys automatically.
5. In **Supabase → Authentication → URL Configuration**, set **Site URL** to your Vercel URL (e.g. `https://edumanage.vercel.app`).

The database setup (`npm run db:setup`) and demo data (`npm run seed`) run from your own computer against the same Supabase project. Vercel only runs the website.

## 6. Suggested demo
1. Log in as **admin**. Show the dashboard.
2. **Students → Add Student** (e.g. BCA, Semester 4).
3. **Courses** → *View subjects* for BCA.
4. **Attendance** → BCA → Sem 4 → Java Programming → today → mark → Save. Show the percentages.
5. **Results** → enter marks → the grade appears instantly → *Save & publish*.
6. **Announcements** → publish a notice.
7. Log out and log in as the **new student**. Show the dashboard, attendance, results and announcements.
8. As the student, open `/admin` in the address bar. You are redirected back to the student portal.

## Scripts
| Command | Purpose |
|---|---|
| `npm run dev` | development server |
| `npm run build` / `npm start` | production build / server |
| `npm run lint` | ESLint |
| `npm run db:setup` | create tables from `supabase/schema.sql` |
| `npm run seed` | load demo data |
