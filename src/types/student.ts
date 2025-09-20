// Unified Student interface for the entire application
export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  pathwayNumber: string;
  sectionId: string; // Section IDs are string-based
  gender: string;
  birthDate: string;
  classOrder: number;
  score?: number;
  absences?: number;
  isPresent?: boolean;
  lastAssessment?: string;
  // Legacy properties for compatibility
  trackNumber?: string;
  dateOfBirth?: string;
  studentNumberInSection?: number;
  badge?: string;
}

export interface StudentFormData {
  firstName: string;
  lastName: string;
  pathwayNumber: string;
  sectionId: string;
  gender: string;
  birthDate: string;
}

export interface StudentTableProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: (studentId: number) => void;
  onDetail: (student: Student) => void;
  onAssess: (student: Student) => void;
  onUpdateNumber: (studentId: number, newNumber: number) => void;
  // Attendance mode controls
  isAttendanceMode?: boolean;
  attendanceStatus?: Record<string, boolean>;
  onToggleAttendance?: (studentId: string, isPresent: boolean) => void;
}