-- =====================================================================
--  EduManage – Education Management Software
--  Database schema for Supabase (PostgreSQL)
--
--  How to use:
--    Supabase Dashboard → SQL Editor → New query → paste this file → Run
--
--  The script is safe to re-run: it drops and recreates the EduManage
--  tables (all data in them is deleted).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Clean up (so the script can be re-run during development)
-- ---------------------------------------------------------------------
drop table if exists public.results        cascade;
drop table if exists public.attendance     cascade;
drop table if exists public.announcements  cascade;
drop table if exists public.grading_rules  cascade;
drop table if exists public.students       cascade;
drop table if exists public.faculty        cascade;
drop table if exists public.subjects       cascade;
drop table if exists public.courses        cascade;
drop table if exists public.profiles       cascade;
drop function if exists public.get_my_role()       cascade;
drop function if exists public.is_admin()          cascade;
drop function if exists public.is_staff()          cascade;
drop function if exists public.get_my_student_id() cascade;
drop type if exists public.user_role cascade;

-- ---------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------

-- Every login account has one role.
create type public.user_role as enum ('admin', 'faculty', 'student');

-- profiles = the "users" table of the application.
-- Passwords are NOT stored here: Supabase Auth keeps them (bcrypt hashed)
-- in auth.users. profiles.id is the same id as auth.users.id.
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text not null,
  email       text not null unique,
  role        public.user_role not null default 'student',
  created_at  timestamptz not null default now()
);

create table public.courses (
  id              bigint generated always as identity primary key,
  course_name     text not null unique,
  duration_years  int  not null check (duration_years between 1 and 6),
  description     text,
  created_at      timestamptz not null default now()
);

create table public.subjects (
  id            bigint generated always as identity primary key,
  subject_name  text not null,
  subject_code  text,
  course_id     bigint not null references public.courses (id) on delete cascade,
  semester      int  not null check (semester between 1 and 12),
  max_marks     int  not null default 100 check (max_marks > 0),
  created_at    timestamptz not null default now(),
  unique (course_id, semester, subject_name)
);

create table public.students (
  id           bigint generated always as identity primary key,
  user_id      uuid not null unique references public.profiles (id) on delete cascade,
  roll_number  text not null unique,              -- business rule: no duplicate roll numbers
  course_id    bigint not null references public.courses (id) on delete restrict,
  semester     int  not null check (semester between 1 and 12),
  phone        text,
  department   text,
  created_at   timestamptz not null default now()
);

create table public.faculty (
  id           bigint generated always as identity primary key,
  user_id      uuid not null unique references public.profiles (id) on delete cascade,
  department   text not null,
  designation  text not null,
  phone        text,
  created_at   timestamptz not null default now()
);

create table public.attendance (
  id          bigint generated always as identity primary key,
  student_id  bigint not null references public.students (id) on delete cascade,
  subject_id  bigint not null references public.subjects (id) on delete cascade,
  date        date   not null,
  status      text   not null check (status in ('present', 'absent')),
  marked_by   uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  -- business rule: attendance can't be entered twice for the same student, subject and date
  unique (student_id, subject_id, date)
);

create table public.results (
  id           bigint generated always as identity primary key,
  student_id   bigint not null references public.students (id) on delete cascade,
  subject_id   bigint not null references public.subjects (id) on delete cascade,
  marks        numeric(6,2) not null check (marks >= 0),
  total_marks  numeric(6,2) not null check (total_marks > 0),
  grade        text not null,
  published    boolean not null default false,
  entered_by   uuid references public.profiles (id) on delete set null,
  updated_at   timestamptz not null default now(),
  check (marks <= total_marks),                   -- business rule: marks can't exceed the maximum
  unique (student_id, subject_id)
);

-- Configurable grading rules: a percentage >= min_percentage earns that grade.
create table public.grading_rules (
  id              bigint generated always as identity primary key,
  grade           text not null unique,
  min_percentage  numeric(5,2) not null unique check (min_percentage between 0 and 100)
);

create table public.announcements (
  id           bigint generated always as identity primary key,
  title        text not null,
  description  text not null,
  audience     text not null default 'all' check (audience in ('all', 'students', 'faculty')),
  date         date not null default current_date,
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

-- Helpful indexes for the most common look-ups
create index on public.students   (course_id, semester);
create index on public.subjects   (course_id, semester);
create index on public.attendance (subject_id, date);
create index on public.attendance (student_id);
create index on public.results    (student_id);

-- ---------------------------------------------------------------------
-- 2. Helper functions used by the security policies
--    (security definer = they can read profiles without hitting RLS loops)
-- ---------------------------------------------------------------------
create function public.get_my_role() returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.get_my_role() = 'admin', false)
$$;

create function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.get_my_role() in ('admin', 'faculty'), false)
$$;

create function public.get_my_student_id() returns bigint
language sql stable security definer set search_path = public as $$
  select id from public.students where user_id = auth.uid()
$$;

-- ---------------------------------------------------------------------
-- 3. Row Level Security (RLS)
--    The database itself enforces who can read / change which rows.
--    Admin   → everything
--    Faculty → read everything, manage attendance, results, announcements
--    Student → read only their own records
-- ---------------------------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.courses       enable row level security;
alter table public.subjects      enable row level security;
alter table public.students      enable row level security;
alter table public.faculty       enable row level security;
alter table public.attendance    enable row level security;
alter table public.results       enable row level security;
alter table public.grading_rules enable row level security;
alter table public.announcements enable row level security;

-- profiles
create policy "profiles: read own or staff reads all" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_staff());
create policy "profiles: admin manages" on public.profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- courses, subjects, grading rules: everyone logged in can read, admin manages
create policy "courses: read" on public.courses
  for select to authenticated using (true);
create policy "courses: admin manages" on public.courses
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "subjects: read" on public.subjects
  for select to authenticated using (true);
create policy "subjects: admin manages" on public.subjects
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "grading_rules: read" on public.grading_rules
  for select to authenticated using (true);
create policy "grading_rules: admin manages" on public.grading_rules
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- students
create policy "students: read own or staff" on public.students
  for select to authenticated using (user_id = auth.uid() or public.is_staff());
create policy "students: admin manages" on public.students
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- faculty
create policy "faculty: staff reads" on public.faculty
  for select to authenticated using (public.is_staff());
create policy "faculty: admin manages" on public.faculty
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- attendance
create policy "attendance: read own or staff" on public.attendance
  for select to authenticated using (student_id = public.get_my_student_id() or public.is_staff());
create policy "attendance: staff manages" on public.attendance
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- results (students only see results that have been published)
create policy "results: read own published or staff" on public.results
  for select to authenticated
  using ((student_id = public.get_my_student_id() and published) or public.is_staff());
create policy "results: staff manages" on public.results
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- announcements
create policy "announcements: read" on public.announcements
  for select to authenticated
  using (public.is_staff() or audience in ('all', 'students'));
create policy "announcements: staff creates" on public.announcements
  for insert to authenticated with check (public.is_staff() and created_by = auth.uid());
create policy "announcements: admin or author deletes" on public.announcements
  for delete to authenticated using (public.is_admin() or created_by = auth.uid());

-- Table privileges for the Supabase API roles (RLS above still decides which rows).
grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
grant execute on all functions in schema public to authenticated, service_role;

-- ---------------------------------------------------------------------
-- 4. Default grading rules (editable from the Results screen)
-- ---------------------------------------------------------------------
insert into public.grading_rules (grade, min_percentage) values
  ('A+', 90), ('A', 80), ('B+', 70), ('B', 60), ('C', 50), ('D', 40), ('F', 0);
