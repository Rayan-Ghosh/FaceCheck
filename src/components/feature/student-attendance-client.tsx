
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { Class, User } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { CameraView } from '@/components/feature/camera-view';
import { verifyStudentFace } from '@/ai/flows/student-face-verification';
import { verifyTeacherFace } from '@/ai/flows/teacher-face-verification';
import { markAttendance } from '@/lib/actions/class-actions';
import { CheckCircle, Loader2, XCircle, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/icons/logo';

type AttendanceState = 'IDLE' | 'VERIFYING_STUDENT' | 'VERIFYING_TEACHER' | 'SUBMITTING' | 'SUCCESS' | 'FAILURE';

const attendanceSchema = z.object({
  classId: z.string().min(1, 'Please select a class.'),
  studentId: z.string(), // Student ID is now derived from the logged-in user
});

type AttendanceFormValues = z.infer<typeof attendanceSchema>;

interface StudentAttendanceClientProps {
  availableClasses: Class[];
  student: User | null | undefined;
}

export function StudentAttendanceClient({ availableClasses, student }: StudentAttendanceClientProps) {
  const [state, setState] = useState<AttendanceState>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState<Omit<AttendanceFormValues, 'studentId'> | null>(null);

  const { toast } = useToast();
  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: { classId: '', studentId: student?.id || '' },
  });

  useEffect(() => {
    // If student data becomes available, set it in the form.
    if(student) {
      form.setValue('studentId', student.id);
    }
  }, [student, form]);

  if (!student) {
    return (
       <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="text-center flex flex-col items-center">
              <XCircle className="h-24 w-24 text-red-500 mb-4" />
              <h2 className="font-headline text-3xl font-bold">Authentication Error</h2>
              <p className="mt-2 text-muted-foreground">Could not verify student identity. Please log in again.</p>
              <Button onClick={() => window.location.href = '/login/user'} className="mt-8">Go to Login</Button>
            </div>
          </div>
    )
  }

  const onSubmit = (data: AttendanceFormValues) => {
    const classExists = availableClasses.find(c => c.id === data.classId);
     if (!classExists) {
        toast({
            variant: "destructive",
            title: "Validation Error",
            description: "Invalid Class ID. Please select a valid class."
        });
        return;
    }
    setFormData(data);
    setState('VERIFYING_STUDENT');
  };

  const handleStudentCapture = async (imageDataUri: string) => {
    if (!formData) return;
    
    setState('SUBMITTING');
    try {
      const result = await verifyStudentFace({
        studentId: student.id,
        studentFaceDataUri: imageDataUri,
      });

      if (result.isMatch && result.confidence > 0.75) {
        setState('VERIFYING_TEACHER');
        toast({ title: 'Student Verified!', description: 'Please have your teacher authorize.' });
      } else {
        setErrorMessage('Student face not recognized. Please try again.');
        setState('FAILURE');
      }
    } catch (e) {
      console.error(e);
      setErrorMessage((e as Error).message || 'An error occurred during student verification.');
      setState('FAILURE');
    }
  };

  const handleTeacherCapture = async (imageDataUri: string) => {
    if (!formData) return;
    
    setState('SUBMITTING');
    try {
      const verifyResult = await verifyTeacherFace({
        teacherPhotoDataUri: imageDataUri,
        classId: formData.classId,
      });

      if (verifyResult.isTeacherVerified && verifyResult.teacherId) {
        // Teacher verified, now mark attendance
        const markResult = await markAttendance({
          classId: formData.classId,
          studentId: student.id,
          teacherId: verifyResult.teacherId,
        });

        if (markResult.success) {
            setState('SUCCESS');
            toast({ title: 'Attendance Marked!', description: `Verified by ${verifyResult.message}. Your attendance has been recorded.` });
        } else {
            throw new Error(markResult.message);
        }

      } else {
        setErrorMessage(verifyResult.message || 'Teacher not recognized. Attendance not marked.');
        setState('FAILURE');
      }
    } catch (e) {
      console.error(e);
      setErrorMessage((e as Error).message || 'An error occurred during teacher verification.');
      setState('FAILURE');
    }
  };

  const resetState = () => {
    setState('IDLE');
    setFormData(null);
    setErrorMessage('');
    form.reset({ classId: '', studentId: student.id });
  };

  const renderContent = () => {
    switch (state) {
      case 'IDLE':
        return (
          <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4"><Logo className="h-16 w-16" /></div>
                <CardTitle className="font-headline text-2xl">Mark Attendance</CardTitle>
                <CardDescription>Welcome, {student.name}! Select your class to begin.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="classId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Class</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={availableClasses.length === 0}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={availableClasses.length > 0 ? "Select your class" : "You are not enrolled in any classes"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90">Start Verification</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        );
      case 'VERIFYING_STUDENT':
        return (
          <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-4">
              <h2 className="font-headline text-2xl text-center font-bold">Step 1: Student Verification</h2>
              <p className="text-center text-muted-foreground">Please position your face in the camera view and hold still.</p>
              <CameraView onCapture={handleStudentCapture} facingMode="user" />
              <Button variant="outline" onClick={resetState} className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4"/>
                  Back
              </Button>
            </div>
          </div>
        );
      case 'VERIFYING_TEACHER':
        return (
          <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-4">
              <h2 className="font-headline text-2xl text-center font-bold">Step 2: Teacher Authorization</h2>
              <p className="text-center text-muted-foreground">Please scan your teacher to confirm attendance.</p>
              <CameraView onCapture={handleTeacherCapture} facingMode="environment" />
               <Button variant="outline" onClick={resetState} className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4"/>
                  Cancel
              </Button>
            </div>
          </div>
        );
      case 'SUBMITTING':
        return (
          <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="text-center">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <p className="mt-4 text-lg font-semibold">Verifying & Saving...</p>
            </div>
          </div>
        );
      case 'SUCCESS':
        return (
          <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="text-center flex flex-col items-center">
              <CheckCircle className="h-24 w-24 text-green-500 mb-4" />
              <h2 className="font-headline text-3xl font-bold">Attendance Marked Successfully!</h2>
              <Button onClick={resetState} className="mt-8">Mark Another</Button>
            </div>
          </div>
        );
      case 'FAILURE':
        return (
          <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="text-center flex flex-col items-center">
              <XCircle className="h-24 w-24 text-red-500 mb-4" />
              <h2 className="font-headline text-3xl font-bold">Verification Failed</h2>
              <p className="mt-2 text-muted-foreground">{errorMessage}</p>
              <Button onClick={resetState} className="mt-8">Try Again</Button>
            </div>
          </div>
        );
    }
  };

  return renderContent();
}
