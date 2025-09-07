
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, Loader2, UserPlus } from 'lucide-react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CameraView } from '@/components/feature/camera-view';
import { registerUser } from '@/ai/flows/register-user';
import { revalidateAdminDashboard } from '@/lib/actions/class-actions';

const registerSchema = z.object({
  name: z.string().min(3, 'Full name must be at least 3 characters.'),
  role: z.enum(['Student', 'Teacher']),
  faceprint: z.string().min(1, 'Face capture is required.'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterUserPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const {
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', role: 'Student', faceprint: '' },
  });

  const faceprint = watch('faceprint');

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const result = await registerUser(data);
      toast({
        title: 'User Registered',
        description: `User: ${result.name} | Username: ${result.username} | Password: ${result.password}`,
        duration: 9000,
      });
      // After successful registration, revalidate the dashboard path
      await revalidateAdminDashboard();
      reset();
    } catch (error) {
      console.error('Registration failed:', error);
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: (error as Error).message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCapture = (imageDataUri: string) => {
    setValue('faceprint', imageDataUri, { shouldValidate: true });
    setIsCameraOpen(false);
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">Register New User</h1>
        <p className="text-muted-foreground">
          Add new students and teachers to the system.
        </p>
      </header>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>User Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => <Input id="name" placeholder="e.g., John Doe" {...field} />}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Student">Student</SelectItem>
                      <SelectItem value="Teacher">Teacher</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Face Signature</Label>
              <div className="flex items-center gap-4">
                <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline">
                      <Camera className="mr-2 h-4 w-4" />
                      {faceprint ? "Retake Photo" : "Start Face Capture"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Capture Face</DialogTitle>
                    </DialogHeader>
                    <CameraView onCapture={handleCapture} facingMode="user" />
                  </DialogContent>
                </Dialog>
                {faceprint && (
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-green-500">
                    <Image src={faceprint} alt="Captured face" width={80} height={80} className="object-cover" />
                  </div>
                )}
              </div>
              {errors.faceprint && <p className="text-sm text-destructive">{errors.faceprint.message}</p>}
            </div>
            
            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              Register User
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
