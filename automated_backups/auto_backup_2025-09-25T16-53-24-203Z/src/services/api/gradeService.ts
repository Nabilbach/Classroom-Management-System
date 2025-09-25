import { DateTime } from 'luxon';

export interface Student {
  id: string;
  name: string;
  sectionId: string;
}

export interface Assessment {
  id: string;
  title: string;
  category: string;
  weight: number;
  subject: string;
  date: string;
}

export interface Score {
  studentId: string;
  assessmentId: string;
  score: number;
}

const now = DateTime.now();

const mockStudents: Student[] = [
  { id: '1', name: 'الطالب ١', sectionId: 'A' },
  { id: '2', name: 'الطالب ٢', sectionId: 'A' },
  { id: '3', name: 'الطالب ٣', sectionId: 'B' },
  { id: '4', name: 'الطالب ٤', sectionId: 'B' },
  { id: '5', name: 'الطالب ٥', sectionId: 'C' },
];

const mockAssessments: Assessment[] = [
  { id: '1', title: 'Quiz 1', category: 'Quiz', weight: 0.2, subject: 'Math', date: now.minus({ days: 7 }).toISODate() },
  { id: '2', title: 'Midterm', category: 'Exam', weight: 0.4, subject: 'Math', date: now.minus({ days: 2 }).toISODate() },
  { id: '3', title: 'Homework 1', category: 'Homework', weight: 0.1, subject: 'Science', date: now.minus({ days: 5 }).toISODate() },
];

const mockScores: Score[] = [
  { studentId: '1', assessmentId: '1', score: 85 },
  { studentId: '2', assessmentId: '1', score: 90 },
  { studentId: '3', assessmentId: '1', score: 75 },
  { studentId: '4', assessmentId: '1', score: 80 },
  { studentId: '5', assessmentId: '1', score: 95 },
  { studentId: '1', assessmentId: '2', score: 88 },
  { studentId: '2', assessmentId: '2', score: 92 },
  { studentId: '3', assessmentId: '2', score: 80 },
  { studentId: '4', assessmentId: '2', score: 85 },
  { studentId: '5', assessmentId: '2', score: 98 },
  { studentId: '1', assessmentId: '3', score: 100 },
  { studentId: '2', assessmentId: '3', score: 100 },
  { studentId: '3', assessmentId: '3', score: 90 },
  { studentId: '4', assessmentId: '3', score: 95 },
  { studentId: '5', assessmentId: '3', score: 100 },
];

export const getStudents = async (): Promise<Student[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(mockStudents);
        }, 500);
    });
};

export const getAssessments = async (): Promise<Assessment[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(mockAssessments);
        }, 500);
    });
};

export const getScores = async (): Promise<Score[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(mockScores);
        }, 500);
    });
};