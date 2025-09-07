"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { createClass } from '@/lib/actions/class-actions';

const classSchema = z.object({
  classId: z.string().min(3, 'Class ID must be at least 3 characters.').max(10, 'Class ID must be 10 characters or less.'),
  className: z.string().min(5, 'Class Name must be at least 5 characters.'),
});

type ClassFormValues = z.infer<typeof classSchema>;

export function CreateClassForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      classId: '',
      className: '',
    },
  });

  const onSubmit = async (data: ClassFormValues) => {
    setIsLoading(true);
    try {
        const result = await createClass(data);
        if (result.success) {
            toast({
                title: 'Class Created',
                description: `Class "${data.className}" has been successfully created.`,
            });
            form.reset();
        } else {
            throw new Error(result.message);
        }
    } catch(error) {
        toast({
            variant: 'destructive',
            title: 'Failed to Create Class',
            description: (error as Error).message,
        });
    }
    finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-lg mx-auto">
        <FormField
          control={form.control}
          name="classId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class ID</FormLabel>
              <FormControl>
                <Input placeholder="e.g., CS101" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="className"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Introduction to Computer Science" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading} className="w-full">
           {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
           Create Class
        </Button>
      </form>
    </Form>
  );
}
