
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { User } from "@/lib/data";
import { Users, BookOpen, User as UserIcon, GraduationCap, Trash2, RefreshCw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserAvatar } from "@/components/feature/user-avatar";
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { deleteUser } from '@/lib/actions/class-actions';

interface DashboardClientProps {
    stats: {
        totalUsers: number;
        totalClasses: number;
        totalTeachers: number;
        totalStudents: number;
    };
    teachers: User[];
    students: User[];
}

export function DashboardClient({ stats, teachers, students }: DashboardClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setIsAlertOpen(true);
  };

  const handleDeleterUser = async () => {
    if (!userToDelete) return;
    try {
      const result = await deleteUser(userToDelete.id);
      if (result.success) {
        toast({
          title: "User Deleted",
          description: `${userToDelete.name} has been removed from the system.`,
        });
        // Force a server-side rerender to fetch the latest data
        router.refresh();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: (error as Error).message,
      });
    } finally {
      setIsAlertOpen(false);
      setUserToDelete(null);
    }
  };

  return (
    <>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user <span className="font-bold">{userToDelete?.name}</span> and remove them from all classes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleterUser} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-8">
        <header className="flex justify-between items-start">
          <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              An overview of the FaceCheck system.
            </p>
          </div>
          <Button onClick={() => router.refresh()} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </header>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClasses}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Teachers</CardTitle>
              <UserIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTeachers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 md:grid-cols-1">
          <section>
              <h2 className="font-headline text-2xl font-semibold">Teachers</h2>
              <Card className="mt-2">
                  <CardContent className="p-0">
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead className="w-16">Avatar</TableHead>
                                  <TableHead>Name</TableHead>
                                  <TableHead>ID</TableHead>
                                  <TableHead>Username</TableHead>
                                  <TableHead>Password</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {teachers.length > 0 ? (
                                  teachers.map(user => (
                                  <TableRow key={user.id}>
                                      <TableCell>
                                          <UserAvatar user={user} className="w-10 h-10" />
                                      </TableCell>
                                      <TableCell className="font-medium">{user.name}</TableCell>
                                      <TableCell>{user.id}</TableCell>
                                      <TableCell>{user.username}</TableCell>
                                      <TableCell>{user.password}</TableCell>
                                      <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(user)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </TableCell>
                                  </TableRow>
                              ))
                              ) : (
                                  <TableRow>
                                      <TableCell colSpan={6} className="text-center">No teachers registered yet.</TableCell>
                                  </TableRow>
                              )}
                          </TableBody>
                      </Table>
                  </CardContent>
              </Card>
          </section>

          <section>
              <h2 className="font-headline text-2xl font-semibold">Students</h2>
              <Card className="mt-2">
                  <CardContent className="p-0">
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead className="w-16">Avatar</TableHead>
                                  <TableHead>Name</TableHead>
                                  <TableHead>ID</TableHead>
                                  <TableHead>Username</TableHead>
                                  <TableHead>Password</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {students.length > 0 ? (
                                  students.map(user => (
                                  <TableRow key={user.id}>
                                      <TableCell>
                                          <UserAvatar user={user} className="w-10 h-10" />
                                      </TableCell>
                                      <TableCell className="font-medium">{user.name}</TableCell>
                                      <TableCell>{user.id}</TableCell>
                                      <TableCell>{user.username}</TableCell>
                                      <TableCell>{user.password}</TableCell>
                                      <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(user)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </TableCell>
                                  </TableRow>
                                  ))
                              ) : (
                                  <TableRow>
                                      <TableCell colSpan={6} className="text-center">No students registered yet.</TableCell>
                                  </TableRow>
                              )}
                          </TableBody>
                      </Table>
                  </CardContent>
              </Card>
          </section>
        </div>
      </div>
    </>
  );
}
