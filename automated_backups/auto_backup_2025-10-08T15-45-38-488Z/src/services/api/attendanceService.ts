import { DateTime } from 'luxon';

export interface AttendanceRecord {
  studentId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
}

const now = DateTime.now();
const mockAttendance: AttendanceRecord[] = [
  { studentId: '1', date: now.toISODate(), status: 'Present' },
  { studentId: '2', date: now.toISODate(), status: 'Present' },
  { studentId: '3', date: now.toISODate(), status: 'Absent' },
  { studentId: '4', date: now.toISODate(), status: 'Present' },
  { studentId: '5', date: now.toISODate(), status: 'Late' },
  { studentId: '1', date: now.minus({ days: 1 }).toISODate(), status: 'Present' },
  { studentId: '2', date: now.minus({ days: 1 }).toISODate(), status: 'Present' },
  { studentId: '3', date: now.minus({ days: 1 }).toISODate(), status: 'Present' },
  { studentId: '4', date: now.minus({ days: 1 }).toISODate(), status: 'Excused' },
  { studentId: '5', date: now.minus({ days: 1 }).toISODate(), status: 'Present' },
];

export const getAttendance = async (): Promise<AttendanceRecord[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(mockAttendance);
    }, 500);
  });
};