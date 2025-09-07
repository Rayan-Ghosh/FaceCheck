
import { StudentAttendanceClient } from "@/components/feature/student-attendance-client";
import { Suspense } from "react";
import type { User, Class } from "@/lib/data";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";

// This tells Next.js to always render this page dynamically,
// ensuring the latest data is fetched from the server.
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

async function getPageData(userId: string) {
    if (!userId) {
        return { user: null, availableClasses: [] };
    }

    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists() || userDoc.data().role !== 'Student') {
        return { user: null, availableClasses: [] };
    }

    const user = { id: userDoc.id, ...userDoc.data() } as User;

    const classesRef = collection(db, "classes");
    const q = query(classesRef, where("studentIds", "array-contains", userId));
    const classesSnapshot = await getDocs(q);
    const availableClasses = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Class[];
    
    return { user, availableClasses };
}


async function StudentAttendancePageContent({ userId }: { userId: string }) {
  // Fetch fresh data from Firestore on the server every time the page is loaded
  const { user, availableClasses } = await getPageData(userId);
  
  return <StudentAttendanceClient availableClasses={availableClasses} student={user}/>;
}

export default function StudentAttendancePage({ searchParams }: PageProps) {
  const userId = typeof searchParams.userId === 'string' ? searchParams.userId : '';

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StudentAttendancePageContent userId={userId} />
    </Suspense>
  )
}
