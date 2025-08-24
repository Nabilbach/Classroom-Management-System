import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface Grades {
  [studentName: string]: {
    [assignmentName: string]: string;
  };
}

interface GradeContextType {
  assignments: string[];
  grades: Grades;
  addGrade: (studentName: string, assignmentName: string, gradeValue: string) => void;
  addAssignment: (newAssignmentName: string) => void;
}

const GradeContext = createContext<GradeContextType | undefined>(undefined);

interface GradeProviderProps {
  children: ReactNode;
}

export const GradeProvider = ({ children }: GradeProviderProps) => {
  const [assignments, setAssignments] = useState<string[]>(() => {
    const savedAssignments = localStorage.getItem('assignments');
    return savedAssignments ? JSON.parse(savedAssignments) : ['Quiz 1', 'Homework 1', 'Exam 1'];
  });
  const [grades, setGrades] = useState<Grades>(() => {
    const savedGrades = localStorage.getItem('grades');
    return savedGrades ? JSON.parse(savedGrades) : {};
  });

  useEffect(() => {
    localStorage.setItem('assignments', JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem('grades', JSON.stringify(grades));
  }, [grades]);

  const addGrade = (studentName: string, assignmentName: string, gradeValue: string) => {
    setGrades((prevGrades) => {
      const newGrades = {
        ...prevGrades,
        [studentName]: {
          ...(prevGrades[studentName] || {}),
          [assignmentName]: gradeValue,
        },
      };
      return newGrades;
    });

    if (!assignments.includes(assignmentName)) {
      setAssignments((prevAssignments) => [...prevAssignments, assignmentName]);
    }
  };

  const addAssignment = (newAssignmentName: string) => {
    if (newAssignmentName && !assignments.includes(newAssignmentName)) {
      setAssignments((prevAssignments) => [...prevAssignments, newAssignmentName]);
    }
  };

  return (
    <GradeContext.Provider value={{ assignments, grades, addGrade, addAssignment }}>
      {children}
    </GradeContext.Provider>
  );
};

export const useGrades = () => {
  const context = useContext(GradeContext);
  if (context === undefined) {
    throw new Error('useGrades must be used within a GradeProvider');
  }
  return context;
};