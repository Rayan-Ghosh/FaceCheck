
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Class, User, AttendanceRecord } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { AttendanceChart } from '@/components/feature/attendance-chart';

interface ViewAttendanceClientProps {
    myClasses: Class[];
    allUsers: User[];
    allClasses: Class[];
    allAttendanceRecords: AttendanceRecord[];
    teacherId: string;
}

export function ViewAttendanceClient({ myClasses, allUsers, allClasses, allAttendanceRecords, teacherId }: ViewAttendanceClientProps) {
  const searchParams = useSearchParams();
  const initialClassId = searchParams.get('classId') || myClasses[0]?.id || '';
  
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId);
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Effect to update selectedClassId if the initial one from props changes
  // This handles the case where the user navigates here from the dashboard with a classId in the URL
  useEffect(() => {
    setSelectedClassId(initialClassId);
  }, [initialClassId]);

  const selectedClass = useMemo(() => allClasses.find(c => c.id === selectedClassId), [selectedClassId, allClasses]);
  
  const studentsInClass = useMemo(() => {
    if (!selectedClass) return [];
    return allUsers.filter(u => selectedClass.studentIds.includes(u.id));
  }, [selectedClass, allUsers]);

  const attendanceForDate = useMemo(() => {
    if (!date || !selectedClassId) return null;
    const dateString = format(date, 'yyyy-MM-dd');
    return allAttendanceRecords.find(r => r.classId === selectedClassId && r.date === dateString);
  }, [selectedClassId, date, allAttendanceRecords]);

  const attendanceDataForChart = useMemo(() => {
    if (!selectedClassId) return [];
    const recordsForClass = allAttendanceRecords.filter(r => r.classId === selectedClassId);
    return recordsForClass.map(r => ({
      date: r.date,
      present: r.presentStudentIds.length,
      absent: (selectedClass?.studentIds.length || 0) - r.presentStudentIds.length,
    })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [selectedClassId, selectedClass, allAttendanceRecords]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">View Attendance</h1>
        <p className="text-muted-foreground">Select a class and date to view attendance records.</p>
      </header>

      {myClasses.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">You are not assigned to any classes. Please contact an administrator.</p>
          </CardContent>
        </Card>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                    {myClasses.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name} ({c.id})</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Card className="flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="p-0"
              />
            </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                Attendance for {selectedClass?.name || "..."}
              </CardTitle>
              <CardDescription>
                {date ? `Date: ${format(date, 'PPP')}` : 'Please select a date'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsInClass.map(student => {
                    const isPresent = !!attendanceForDate?.presentStudentIds.includes(student.id);
                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.id}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={isPresent ? 'default' : 'destructive'} className={isPresent ? 'bg-green-600' : 'bg-red-600'}>
                            {isPresent ? 'Present' : 'Absent'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {studentsInClass.length === 0 && selectedClassId && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">No students enrolled in this class.</TableCell>
                    </TableRow>
                  )}
                   {!selectedClassId && (
                     <TableRow>
                        <TableCell colSpan={3} className="text-center">Please select a class.</TableCell>
                    </TableRow>
                   )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
      )}
      {attendanceDataForChart.length > 0 &&
        <Card>
            <CardHeader>
                <CardTitle>Attendance Trend</CardTitle>
                <CardDescription>Presence vs. Absence over time for {selectedClass?.name}.</CardDescription>
            </CardHeader>
            <CardContent>
                <AttendanceChart data={attendanceDataForChart} />
            </CardContent>
        </Card>
      }
    </div>
  );
}
