
import { Suspense } from 'react';
import { ViewAttendanceClient } from '@/components/feature/view-attendance-client';
import { Skeleton } from '@/components/ui/skeleton';
import type { User, Class, AttendanceRecord } from "@/lib/data";
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

// This tells Next.js to always render this page dynamically, ensuring fresh data.
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

async function getPageData(userId: string) {
    if (!userId) {
        return { myClasses: [], allUsers: [], allClasses: [], allAttendanceRecords: [], teacherId: '' };
    }

    const usersRef = collection(db, "users");
    const classesRef = collection(db, "classes");
    const attendanceRef = collection(db, "attendance");

    const [usersSnapshot, classesSnapshot, attendanceSnapshot] = await Promise.all([
        getDocs(usersRef),
        getDocs(classesRef),
        getDocs(attendanceRef)
    ]);
    
    const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
    const allClasses = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Class[];
    const allAttendanceRecords = attendanceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AttendanceRecord[];
    
    // Filter classes for the logged-in teacher
    const myClasses = allClasses.filter(c => c.teacherIds.includes(userId));

    return { myClasses, allUsers, allClasses, allAttendanceRecords, teacherId: userId };
}


async function ViewAttendanceContent({ userId }: { userId: string}) {
  // Fetch fresh data from Firestore every time the page is loaded
  const { myClasses, allUsers, allClasses, allAttendanceRecords, teacherId } = await getPageData(userId);

  return (
      <ViewAttendanceClient 
        myClasses={myClasses}
        allUsers={allUsers}
        allClasses={allClasses}
        allAttendanceRecords={allAttendanceRecords}
        teacherId={teacherId}
      />
  );
}


export default function ViewAttendancePage({ searchParams }: PageProps) {
    const userId = typeof searchParams.userId === 'string' ? searchParams.userId : '';

    return (
        <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <ViewAttendanceContent userId={userId}/>
        </Suspense>
    )
}
