import { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';

// This interface should match the Student model in your backend
interface Student {
  id: number;
  firstName: string;
  lastName: string;
  pathwayNumber: string;
  sectionId: number;
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
      
      // Convert snake_case to camelCase
      const camelCaseData = data.map((student: any) => ({
        id: student.id,
        firstName: student.first_name,
        lastName: student.last_name,
        pathwayNumber: student.pathway_number,
        sectionId: student.sectionId,
        gender: student.gender,
        birthDate: student.birth_date,
        classOrder: student.class_order,
        score: student.score, // This will be undefined until backend provides it
      }));

      setStudents(camelCaseData);
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
    // Convert camelCase to snake_case for sending to backend
    const studentToSend = {
      first_name: student.firstName,
      last_name: student.lastName,
      pathway_number: student.pathwayNumber,
      sectionId: student.sectionId,
      gender: student.gender,
      birth_date: student.birthDate,
      class_order: student.classOrder,
    };

    try {
      const response = await fetch(`${API_URL}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentToSend),
      });
      if (!response.ok) {
        throw new Error('Failed to add student');
      }
      await fetchStudents(); // Refetch to get the updated list
    } catch (error) {
      console.error('Error adding student:', error);
    }
  };

  const editStudent = async (id: number, updatedData: Partial<Student>) => {
    // Convert camelCase to snake_case for sending to backend
    const updatedDataToSend: any = {};
    if (updatedData.firstName !== undefined) updatedDataToSend.first_name = updatedData.firstName;
    if (updatedData.lastName !== undefined) updatedDataToSend.last_name = updatedData.lastName;
    if (updatedData.pathwayNumber !== undefined) updatedDataToSend.pathway_number = updatedData.pathwayNumber;
    if (updatedData.sectionId !== undefined) updatedDataToSend.sectionId = updatedData.sectionId;
    if (updatedData.gender !== undefined) updatedDataToSend.gender = updatedData.gender;
    if (updatedData.birthDate !== undefined) updatedDataToSend.birth_date = updatedData.birthDate;
    if (updatedData.classOrder !== undefined) updatedDataToSend.class_order = updatedData.classOrder;

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
