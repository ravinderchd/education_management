import { FileBarChart, Award, Percent } from "lucide-react";
import { getMyStudent } from "@/lib/student";
import { PageHeader, Section, StatCard } from "@/components/ui";
import ResultsTable from "@/components/academic/ResultsTable";
import NoStudentRecord from "@/components/academic/NoStudentRecord";
import { summarizeResults } from "@/lib/academics";

export const metadata = { title: "My Results" };

export default async function MyResults() {
  const { supabase, student } = await getMyStudent();
  if (!student) {
    return (
      <>
        <PageHeader title="My Results" />
        <NoStudentRecord />
      </>
    );
  }

  // RLS only returns this student's PUBLISHED results
  const [{ data: results }, { data: rules }] = await Promise.all([
    supabase
      .from("results")
      .select("id, marks, total_marks, grade, subject:subjects(subject_name, subject_code, semester)")
      .eq("student_id", student.id),
    supabase.from("grading_rules").select("grade, min_percentage"),
  ]);

  const list = results || [];
  const total = summarizeResults(list, rules || []);

  return (
    <>
      <PageHeader title="My Results" subtitle="Published examination marks and grades" />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={FileBarChart} label="Total marks" value={list.length ? `${total.obtained} / ${total.maximum}` : "–"} tone="blue" />
        <StatCard icon={Percent} label="Percentage" value={list.length ? `${total.percentage}%` : "–"} tone="violet" />
        <StatCard icon={Award} label="Overall grade" value={total.grade} tone="green" />
      </div>

      <Section title="Subject-wise marks" bodyClassName="">
        <ResultsTable results={list} rules={rules || []} />
      </Section>
    </>
  );
}
