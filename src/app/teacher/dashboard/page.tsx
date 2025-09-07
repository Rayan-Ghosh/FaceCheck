
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import type { User, Class } from "@/lib/data";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";

// This tells Next.js to always render this page dynamically, ensuring fresh data.
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

async function getPageData(userId: string) {
  if (!userId) {
    return { loggedInTeacher: null, myClasses: [] };
  }

  const teacherRef = doc(db, "users", userId);
  const teacherDoc = await getDoc(teacherRef);

  if (!teacherDoc.exists() || teacherDoc.data().role !== 'Teacher') {
    return { loggedInTeacher: null, myClasses: [] };
  }
  const loggedInTeacher = { id: teacherDoc.id, ...teacherDoc.data() } as User;

  const classesRef = collection(db, "classes");
  const q = query(classesRef, where("teacherIds", "array-contains", userId));
  const classesSnapshot = await getDocs(q);
  const myClasses = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Class[];
  
  return { loggedInTeacher, myClasses };
}


export default async function TeacherDashboardPage({ searchParams }: PageProps) {
  const userId = typeof searchParams.userId === 'string' ? searchParams.userId : '';
  const { loggedInTeacher, myClasses } = await getPageData(userId);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">My Dashboard</h1>
        <p className="text-muted-foreground">
          {loggedInTeacher ? `Welcome back, ${loggedInTeacher.name}!` : "Welcome! Please log in."} Here are your assigned classes.
        </p>
      </header>

      {!loggedInTeacher ? (
         <Card>
            <CardContent className="pt-6">
                 <p className="text-center text-muted-foreground">Could not find teacher information. Please try logging in again.</p>
            </CardContent>
        </Card>
      ) : myClasses.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {myClasses.map(c => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle>{c.name}</CardTitle>
                <CardDescription>Class ID: {c.id}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{c.studentIds.length} students enrolled.</p>
                <Button asChild className="w-full">
                  <Link href={`/teacher/attendance?classId=${c.id}&userId=${userId}`}>
                    View Attendance <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
            <CardContent className="pt-6">
                 <p className="text-center text-muted-foreground">You are not currently assigned to any classes. An administrator can assign you to one.</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
