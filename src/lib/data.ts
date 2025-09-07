// This file defines the data structures for the application.
// Data is now managed by Firebase Firestore, so the mock data arrays have been removed.

export interface User {
  id: string; // Document ID from Firestore
  name: string;
  role: 'Student' | 'Teacher';
  faceprint: string; // Data URI
  username: string;
  password?: string;
}

export interface Class {
  id: string; // Document ID from Firestore
  name:string;
  teacherIds: string[];
  studentIds: string[];
}

export interface AttendanceRecord {
  id?: string; // Document ID from Firestore
  classId: string;
  date: string; // YYYY-MM-DD
  presentStudentIds: string[];
  teacherId: string;
}
