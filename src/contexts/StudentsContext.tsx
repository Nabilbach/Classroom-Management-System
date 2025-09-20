import { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';

// This interface should match the Student model in your backend
interface Student {
  id: number;
  firstName: string;
  lastName: string;
  pathwayNumber: string;
  sectionId: string; // Section IDs are strings in the DB (e.g., "1BACSE-1")
  gender: string;
  birthDate: string;
  classOrder: number;
  score?: number; // The current score, fetched from the server
}

interface StudentsContextType {
  students: Student[];
  addStudent: (student: Omit<Student, 'id'>) => Promise<void>;
  editStudent: (id: number, updatedData: Partial<Student>) => Promise<void>;
  deleteStudent: (id: number) => Promise<void>;
  isLoading: boolean;
  fetchStudents: () => Promise<void>;
}

const StudentsContext = createContext<StudentsContextType | undefined>(undefined);

interface StudentsProviderProps {
  children: ReactNode;
}

const API_URL = 'http://localhost:3000/api';

export const StudentsProvider = ({ children }: StudentsProviderProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/students`);
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      const data = await response.json();
      
      console.log('✅ Students received from API:', data?.length || 0, 'students');
      console.log('Sample student:', data?.[0]);
      
      // Data is already in camelCase from the backend
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const addStudent = async (student: Omit<Student, 'id'>) => {
    // Send camelCase to match backend model attributes
    const studentToSend = {
      firstName: student.firstName,
      lastName: student.lastName,
      pathwayNumber: student.pathwayNumber ?? '',
      sectionId: student.sectionId,
      gender: student.gender,
      birthDate: student.birthDate ?? null,
      classOrder: student.classOrder ?? null,
    } as any;

    try {
      const response = await fetch(`${API_URL}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentToSend),
      });
      if (!response.ok) {
        let message = 'Failed to add student';
        try {
          const err = await response.json();
          if (err?.message) message = err.message;
        } catch {}
        throw new Error(message);
      }
      await fetchStudents(); // Refetch to get the updated list
    } catch (error) {
      console.error('Error adding student:', error);
    }
  };

  const editStudent = async (id: number, updatedData: Partial<Student>) => {
    // Keep attribute names in camelCase to match backend model; only map when backend expects snake_case
    const updatedDataToSend: any = {};
    if (updatedData.firstName !== undefined) updatedDataToSend.firstName = updatedData.firstName;
    if (updatedData.lastName !== undefined) updatedDataToSend.lastName = updatedData.lastName;
    if (updatedData.pathwayNumber !== undefined) updatedDataToSend.pathwayNumber = updatedData.pathwayNumber;
    if (updatedData.sectionId !== undefined) updatedDataToSend.sectionId = updatedData.sectionId;
    if (updatedData.gender !== undefined) updatedDataToSend.gender = updatedData.gender;
    if (updatedData.birthDate !== undefined) updatedDataToSend.birthDate = updatedData.birthDate;
    if (updatedData.classOrder !== undefined) updatedDataToSend.classOrder = updatedData.classOrder;

    try {
      const response = await fetch(`${API_URL}/students/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedDataToSend),
      });
      if (!response.ok) {
        throw new Error('Failed to edit student');
      }
      await fetchStudents(); // Refetch to get the updated list
    } catch (error) {
      console.error('Error editing student:', error);
    }
  };

  const deleteStudent = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/students/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete student');
      }
      await fetchStudents(); // Refetch to get the updated list
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };

  return (
    <StudentsContext.Provider value={{
      students,
      addStudent,
      editStudent,
      deleteStudent,
      isLoading,
      fetchStudents,
    }}>
      {children}
    </StudentsContext.Provider>
  );
};

export const useStudents = () => {
  const context = useContext(StudentsContext);
  if (context === undefined) {
    throw new Error('useStudents must be used within a StudentsProvider');
  }
  return context;
};