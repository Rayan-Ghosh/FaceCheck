
import { DashboardClient } from "@/components/feature/dashboard-client";
import { db } from "@/lib/firebase";
import type { User, Class } from "@/lib/data";
import { collection, getDocs, query, where } from "firebase/firestore";

// This tells Next.js to always render this page dynamically,
// preventing build errors with client-side hooks like useSearchParams in the layout.
export const dynamic = 'force-dynamic';

async function getDashboardData() {
  const usersRef = collection(db, "users");
  const classesRef = collection(db, "classes");

  const [usersSnapshot, classesSnapshot] = await Promise.all([
    getDocs(usersRef),
    getDocs(classesRef)
  ]);

  const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
  
  const teachers = allUsers.filter(user => user.role === 'Teacher');
  const students = allUsers.filter(user => user.role === 'Student');

  const stats = {
    totalUsers: allUsers.length,
    totalClasses: classesSnapshot.size,
    totalTeachers: teachers.length,
    totalStudents: students.length,
  };

  return { stats, teachers, students };
}


export default async function AdminDashboardPage() {
  // Fetch fresh data from Firestore every time the page is loaded
  const { stats, teachers, students } = await getDashboardData();
  
  return (
    <DashboardClient
      stats={stats}
      teachers={teachers}
      students={students}
    />
  );
}
