import { Header } from "@/components/layout/header";

// This tells Next.js to always render this page and its children dynamically.
// This is required to prevent build errors when using useSearchParams in the header.
export const dynamic = 'force-dynamic';

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
