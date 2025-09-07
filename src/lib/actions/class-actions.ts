
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, where, writeBatch } from 'firebase/firestore';
import type { User, Class, AttendanceRecord } from "@/lib/data";
import { format } from "date-fns";
import { revalidatePath } from 'next/cache';

interface UpdateRosterInput {
    classId: string;
    teacherIds: string[];
    studentIds: string[];
}

interface CreateClassInput {
    classId: string;
    className: string;
}

interface LoginInput {
    username?: string;
    password?: string;
}

interface MarkAttendanceInput {
    classId: string;
    studentId: string;
    teacherId: string;
}


/**
 * Updates the roster for a given class in Firestore.
 */
export async function updateRoster(input: UpdateRosterInput): Promise<{ success: boolean; message: string }> {
    console.log("Updating roster with input:", input);
    try {
        const classRef = doc(db, "classes", input.classId);
        await updateDoc(classRef, {
            teacherIds: input.teacherIds,
            studentIds: input.studentIds
        });
        console.log(`Successfully updated roster for class ${input.classId} in Firestore.`);
        revalidatePath('/admin/classes');
        return { success: true, message: 'Roster updated successfully.' };
    } catch (error) {
        console.error("Error updating roster: ", error);
        return { success: false, message: `Failed to update roster: ${(error as Error).message}` };
    }
}

/**
 * Creates a new class in Firestore. The document ID will be the provided classId.
 */
export async function createClass(input: CreateClassInput): Promise<{ success: boolean; message: string }> {
    console.log("Creating class with input:", input);
    try {
        const classRef = doc(db, "classes", input.classId);
        await setDoc(classRef, {
            id: input.classId,
            name: input.className,
            teacherIds: [],
            studentIds: [],
        });
        console.log(`Successfully created class ${input.className} in Firestore.`);
        revalidatePath('/admin/classes');
        return { success: true, message: 'Class created successfully.' };
    } catch (error) {
        console.error("Error creating class: ", error);
        return { success: false, message: `A class with ID "${input.classId}" may already exist or an error occurred.` };
    }
}

/**
 * Attempts to log in a user by checking credentials in Firestore.
 */
export async function loginUser(input: LoginInput): Promise<{ success: boolean; message: string; user?: User }> {
    if (!input.username || !input.password) {
        return { success: false, message: "Username and password are required." };
    }

    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", input.username));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return { success: false, message: "User not found." };
        }

        const userDoc = querySnapshot.docs[0];
        const user = { id: userDoc.id, ...userDoc.data() } as User;

        if (user.password !== input.password) {
            return { success: false, message: "Incorrect password." };
        }

        return { success: true, message: "Login successful", user: user };
    } catch (error) {
        console.error("Error logging in user: ", error);
        return { success: false, message: "An error occurred during login." };
    }
}


/**
 * Deletes a user from Firestore and un-enrolls them from classes.
 */
export async function deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    console.log(`Attempting to delete user with ID: ${userId}`);
    try {
        const batch = writeBatch(db);

        // 1. Delete the user document
        const userRef = doc(db, "users", userId);
        batch.delete(userRef);
        console.log(`Scheduled deletion for user ${userId}.`);

        // 2. Remove user from all class rosters
        const classesRef = collection(db, "classes");
        const classesSnapshot = await getDocs(classesRef);
        classesSnapshot.forEach(classDoc => {
            const classData = classDoc.data() as Class;
            const teacherIds = classData.teacherIds.filter(id => id !== userId);
            const studentIds = classData.studentIds.filter(id => id !== userId);
            
            // Only update if the user was actually in the roster
            if (teacherIds.length !== classData.teacherIds.length || studentIds.length !== classData.studentIds.length) {
                batch.update(classDoc.ref, { teacherIds, studentIds });
                console.log(`Scheduled roster update for class ${classDoc.id}.`);
            }
        });

        await batch.commit();
        console.log(`Successfully committed batch deletion for user ${userId}.`);
        revalidatePath('/admin/dashboard');
        return { success: true, message: 'User deleted successfully.' };
    } catch (error) {
        console.error("Error deleting user: ", error);
        return { success: false, message: `Failed to delete user: ${(error as Error).message}` };
    }
}


/**
 * Marks a student as present for a specific class on the current date in Firestore.
 * If a record for the day doesn't exist, it creates one.
 */
export async function markAttendance(input: MarkAttendanceInput): Promise<{ success: boolean; message: string }> {
    const { classId, studentId, teacherId } = input;
    const today = format(new Date(), 'yyyy-MM-dd');
    const attendanceId = `${classId}_${today}`; // Create a predictable ID

    console.log(`Marking attendance for student ${studentId} in class ${classId} on ${today}.`);
    
    try {
        const attendanceRef = doc(db, "attendance", attendanceId);
        const attendanceSnapshot = await getDocs(query(collection(db, "attendance"), where("classId", "==", classId), where("date", "==", today)));

        if (attendanceSnapshot.empty) {
            // No record for today, create a new one
            await setDoc(attendanceRef, {
                classId,
                date: today,
                presentStudentIds: [studentId],
                teacherId,
            });
            console.log(`Created new attendance record for class ${classId}.`);
        } else {
            // Record exists, update it
            const recordDoc = attendanceSnapshot.docs[0];
            const recordData = recordDoc.data() as AttendanceRecord;
            if (!recordData.presentStudentIds.includes(studentId)) {
                await updateDoc(recordDoc.ref, {
                    presentStudentIds: [...recordData.presentStudentIds, studentId]
                });
                console.log(`Added student ${studentId} to record for class ${classId}.`);
            } else {
                console.log(`Student ${studentId} already marked present.`);
            }
        }
        return { success: true, message: 'Attendance marked successfully.' };
    } catch (error) {
        console.error("Error marking attendance: ", error);
        return { success: false, message: `Failed to mark attendance: ${(error as Error).message}` };
    }
}

/**
 * Revalidates the cache for the admin dashboard page.
 */
export async function revalidateAdminDashboard() {
  revalidatePath('/admin/dashboard');
  revalidatePath('/admin/classes');
}
