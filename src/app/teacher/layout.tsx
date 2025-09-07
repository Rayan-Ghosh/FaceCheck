import { Header } from "@/components/layout/header";

// This is a server component, so we can access searchParams
export default function TeacherLayout({ 
  children,
}: { 
  children: React.ReactNode,
}) {
  
  // Extract userId to pass to the header for navigation links.
  // Note: Layouts don't receive searchParams directly. We will handle passing the userId on the page level.
  const teacherNavItems = [
      { href: "/teacher/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
      { href: "/teacher/attendance", label: "View Attendance", icon: "CalendarCheck" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="Teacher Portal" navItems={teacherNavItems} />
      <main className="flex-1 container py-8">
        {children}
      </main>
    </div>
  );
}
