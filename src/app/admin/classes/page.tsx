
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateClassForm } from "@/components/feature/create-class-form";
import { ManageRoster } from "@/components/feature/manage-roster";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import type { User, Class } from "@/lib/data";

// This tells Next.js to always render this page dynamically,
// preventing build errors with client-side hooks like useSearchParams in the layout.
export const dynamic = 'force-dynamic';

async function getPageData() {
    const usersRef = collection(db, "users");
    const classesRef = collection(db, "classes");

    const [usersSnapshot, classesSnapshot] = await Promise.all([
        getDocs(usersRef),
        getDocs(classesRef)
    ]);
    
    const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
    const allClasses = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Class[];

    return { allUsers, allClasses };
}

export default async function ManageClassesPage() {
  // Fetch fresh data from Firestore on the server every time the page is loaded
  const { allUsers, allClasses } = await getPageData();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">Manage Classes</h1>
        <p className="text-muted-foreground">
          Create new classes and manage student and teacher enrollments.
        </p>
      </header>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="create">Create Class</TabsTrigger>
          <TabsTrigger value="manage">Manage Roster</TabsTrigger>
        </TabsList>
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create a New Class</CardTitle>
              <CardDescription>
                Define a new class with a unique ID and name.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <CreateClassForm />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <CardTitle>Manage Class Roster</CardTitle>
              <CardDescription>
                Assign teachers and enroll students for an existing class.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pass the fresh data down as props */}
              <ManageRoster allUsers={allUsers} allClasses={allClasses} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
