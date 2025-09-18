import { useMemo } from 'react';
import { Student } from '../contexts/StudentsContext';
import { Section } from '../contexts/SectionsContext';

export const useStudentFilters = (
  students: Student[],
  currentSection: Section | null,
  debouncedSearchTerm: string
) => {
  const sectionStudents = useMemo(() => {
    if (!currentSection) return [];
    return students
      .filter((student) => student.sectionId === Number(currentSection.id))
      .sort((a, b) => a.classOrder - b.classOrder);
  }, [students, currentSection]);

  const filteredStudents = useMemo(() => {
    const studentsToFilter = sectionStudents;
    const trimmedSearch = debouncedSearchTerm.trim();

    if (!trimmedSearch) {
      return studentsToFilter;
    }

    const lowerCaseSearchTerm = trimmedSearch.toLowerCase();
    const startsWithLetter = /^[a-zA-Z]/.test(trimmedSearch);
    const isOnlyDigits = /^\d+$/.test(trimmedSearch);

    return studentsToFilter.filter((student) => {
      if (startsWithLetter) {
        // Rule 1: Starts with Latin letter -> pathwayNumber search
        return student.pathwayNumber?.toLowerCase().includes(lowerCaseSearchTerm) || false;
      } else if (isOnlyDigits) {
        // Rule 2: Only digits -> classOrder search
        return student.classOrder?.toString() === trimmedSearch;
      } else {
        // Rule 3: General search (firstName, lastName, pathwayNumber)
        return (
          student.firstName.toLowerCase().includes(lowerCaseSearchTerm) ||
          student.lastName.toLowerCase().includes(lowerCaseSearchTerm) ||
          (student.pathwayNumber?.toLowerCase().includes(lowerCaseSearchTerm) || false)
        );
      }
    });
  }, [sectionStudents, debouncedSearchTerm]);

  return { sectionStudents, finalFilteredStudents: filteredStudents };
};
