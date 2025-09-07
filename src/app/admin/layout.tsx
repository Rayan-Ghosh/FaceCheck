import { Header } from "@/components/layout/header";

const adminNavItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { href: "/admin/register", label: "Register Users", icon: "UserPlus" },
    { href: "/admin/classes", label: "Manage Classes", icon: "BookCopy" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header title="Admin Portal" navItems={adminNavItems} />
      <main className="flex-1 container py-8">
        {children}
      </main>
    </div>
  );
}
