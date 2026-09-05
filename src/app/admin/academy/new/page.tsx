import { AdminCourseForm } from "@/components/admin/academy-course-form";

export const metadata = {
  title: "دوره جدید",
};

export default function NewAcademyCoursePage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-foreground text-2xl font-extrabold">دوره جدید</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          یک مسیر یادگیری کوتاه و مسئله‌محور بساز.
        </p>
      </header>
      <AdminCourseForm />
    </div>
  );
}
