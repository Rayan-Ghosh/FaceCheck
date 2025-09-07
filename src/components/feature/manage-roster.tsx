
"use client";

import { useState, useMemo } from 'react';
import { User, Class } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { updateRoster } from '@/lib/actions/class-actions';

interface ManageRosterProps {
  allUsers: User[];
  allClasses: Class[];
}

export function ManageRoster({ allUsers, allClasses }: ManageRosterProps) {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const allTeachers = useMemo(() => allUsers.filter(u => u.role === 'Teacher'), [allUsers]);
  const allStudents = useMemo(() => allUsers.filter(u => u.role === 'Student'), [allUsers]);

  const handleClassChange = (classId: string) => {
    const selectedClass = allClasses.find(c => c.id === classId);
    setSelectedClassId(classId);
    if (selectedClass) {
      setSelectedTeacherIds(selectedClass.teacherIds);
      setSelectedStudentIds(selectedClass.studentIds);
    } else {
      setSelectedTeacherIds([]);
      setSelectedStudentIds([]);
    }
  };

  const handleSave = async () => {
    if (!selectedClassId) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select a class first.' });
        return;
    }
    setIsLoading(true);
    
    try {
      const result = await updateRoster({
        classId: selectedClassId,
        teacherIds: selectedTeacherIds,
        studentIds: selectedStudentIds,
      });

      if (result.success) {
        toast({ title: 'Roster Saved', description: `Roster for class ${selectedClassId} has been updated.` });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
       toast({ variant: 'destructive', title: 'Save Failed', description: (error as Error).message });
    } finally {
        setIsLoading(false);
    }
  };
  
  const toggleSelection = (id: string, list: string[], setList: (ids: string[]) => void) => {
    const newSelection = list.includes(id) ? list.filter(itemId => itemId !== id) : [...list, id];
    setList(newSelection);
  }

  if (allClasses.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
        <p>No classes have been created yet.</p>
        <p className="text-sm">Please go to the &quot;Create Class&quot; tab to add your first class.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Select Class</Label>
        <Select onValueChange={handleClassChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a class to manage" />
          </SelectTrigger>
          <SelectContent>
            {allClasses.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name} ({c.id})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedClassId && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2">Assign Teachers</h4>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {allTeachers.map(teacher => (
                    <div key={teacher.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`teacher-${teacher.id}`}
                        checked={selectedTeacherIds.includes(teacher.id)}
                        onCheckedChange={() => toggleSelection(teacher.id, selectedTeacherIds, setSelectedTeacherIds)}
                      />
                      <Label htmlFor={`teacher-${teacher.id}`}>{teacher.name}</Label>
                    </div>
                  ))}
                   {allTeachers.length === 0 && <p className="text-sm text-muted-foreground text-center">No teachers registered.</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2">Enroll Students</h4>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {allStudents.map(student => (
                    <div key={student.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`student-${student.id}`}
                        checked={selectedStudentIds.includes(student.id)}
                        onCheckedChange={() => toggleSelection(student.id, selectedStudentIds, setSelectedStudentIds)}
                      />
                      <Label htmlFor={`student-${student.id}`}>{student.name}</Label>
                    </div>
                  ))}
                  {allStudents.length === 0 && <p className="text-sm text-muted-foreground text-center">No students registered.</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
      
      <Button onClick={handleSave} disabled={!selectedClassId || isLoading} className="w-full">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Roster
      </Button>
    </div>
  );
}
