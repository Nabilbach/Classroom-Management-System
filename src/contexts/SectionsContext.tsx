import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { fetchSections, createSection, updateSection, deleteSection as deleteSectionAPI } from '../services/api/sectionService';

/**
 * @interface Section
 * @property {string} id - Unique identifier for the section.
 * @property {string} name - Name of the section.
 * @property {string} educationalLevel - Educational level of the section.
 * @property {string} specialization - Specialization of the section.
 * @property {string} roomNumber - Room number assigned to the section.
 * @property {string} teacherName - Name of the teacher assigned to the section.
 * @property {string} [courseName] - Optional name of the course assigned to this section.
 * @property {Object.<string, 'not-started' | 'in-progress' | 'completed'>} [lessonProgress] - Progress of lessons for this section, keyed by lesson ID.
 */
export interface Section {
  id: string;
  name: string;
  educationalLevel: string;
  specialization: string;
  roomNumber: string;
  teacherName: string;
  courseName?: string; // New field
  lessonProgress?: { [lessonId: string]: 'not-started' | 'in-progress' | 'completed' };
}

/**
 * @interface SectionContextType
 * @property {Section[]} sections - Array of all sections.
 * @property {boolean} isLoading - Indicates if data is currently being loaded or modified.
 * @property {(section: Omit<Section, 'id'>) => Promise<void>} addSection - Function to add a new section.
 * @property {(id: string, updatedData: Partial<Section>) => Promise<void>} editSection - Function to edit an existing section.
 * @property {(id: string) => Promise<void>} deleteSection - Function to delete a section.
 * @property {Section | null} currentSection - The currently selected section.
 * @property {(section: Section | null) => void} setCurrentSection - Function to set the current section.
 */
interface SectionContextType {
  sections: Section[];
  isLoading: boolean;
  addSection: (section: Omit<Section, 'id'>) => Promise<Section>; // Changed from Promise<void>
  editSection: (id: string, updatedData: Partial<Section>) => Promise<Section>; // Changed from Promise<void>
  deleteSection: (id: string) => Promise<void>;
  deleteAllSections: () => Promise<void>;
  currentSection: Section | null;
  setCurrentSection: (section: Section | null) => void;
}

const SectionContext = createContext<SectionContextType | undefined>(undefined);

/**
 * @interface SectionProviderProps
 * @property {ReactNode} children - React children to be rendered within the provider.
 */
interface SectionProviderProps {
  children: ReactNode;
}

/**
 * @function SectionProvider
 * @param {SectionProviderProps} props - Props for the SectionProvider component.
 * @returns {JSX.Element} The provider component.
 * @description Provides section data and related functions to its children components.
 */
export const SectionProvider = ({ children }: SectionProviderProps) => {
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentSection, setCurrentSection] = useState<Section | null>(null);

  /**
   * @function loadSections
   * @description Fetches sections from the API and updates the state.
   */
  useEffect(() => {
    const loadSections = async () => {
      setIsLoading(true);
      try {
        const data = await fetchSections();
        setSections(data);
        console.log("Sections loaded successfully!");
      } catch (error) {
        console.error("Failed to fetch sections:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSections();
  }, []);

  /**
   * @function addSection
   * @param {Omit<Section, 'id'>} section - The section data to add.
   * @description Adds a new section via API and updates the state.
   */
  const addSection = async (section: Omit<Section, 'id'>) => {
    setIsLoading(true);
    try {
      const newSection = await createSection(section);
      console.log("New section received from API:", newSection); // Added for debugging
      setSections((prevSections) => [...prevSections, newSection]);
      console.log("Section added successfully:", newSection);
    } catch (error) {
      console.error("Failed to add section:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * @function editSection
   * @param {string} id - The ID of the section to edit.
   * @param {Partial<Section>} updatedData - The updated section data.
   * @description Edits an existing section via API and updates the state.
   */
  const editSection = async (id: string, updatedData: Partial<Section>) => {
    setIsLoading(true);
    try {
      const updatedSection = await updateSection(id, updatedData);
      setSections((prevSections) =>
        prevSections.map((sec) => (sec.id === id ? updatedSection : sec))
      );
      console.log("Section updated successfully:", updatedSection);
    } catch (error) {
      console.error("Failed to edit section:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * @function deleteSection
   * @param {string} id - The ID of the section to delete.
   * @description Deletes a section via API and updates the state.
   */
  const deleteSection = async (id: string) => {
    setIsLoading(true);
    try {
      await deleteSectionAPI(id);
      setSections((prevSections) => prevSections.filter((sec) => sec.id !== id));
      console.log("Section deleted successfully:", id);
    } catch (error) {
      console.error("Failed to delete section:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAllSections = async () => {
    setIsLoading(true);
    try {
      await deleteAllSectionsAPI(); // Call the new API function
      setSections([]); // Clear all sections from state
      console.log("All sections deleted successfully!");
    } catch (error) {
      console.error("Failed to delete all sections:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SectionContext.Provider value={{
      sections,
      isLoading,
      addSection,
      editSection,
      deleteSection,
      deleteAllSections,
      currentSection,
      setCurrentSection,
    }}>
      {children}
    </SectionContext.Provider>
  );
};

/**
 * @function useSections
 * @description Custom hook to access the SectionContext.
 * @returns {SectionContextType} The section context value.
 * @throws {Error} If used outside of a SectionProvider.
 */
export const useSections = () => {
  const context = useContext(SectionContext);
  if (context === undefined) {
    throw new Error('useSections must be used within a SectionProvider');
  }
  return context;
};