import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { fetchLessons, createLesson, updateLesson, deleteLesson as deleteLessonAPI } from '../services/api/lessonService';

/**
 * @interface LessonStage
 * @property {string} id - Unique identifier for the lesson stage.
 * @property {string} title - Title or description of the lesson stage.
 * @property {boolean} isCompleted - Indicates if the lesson stage is completed.
 */
export interface LessonStage {
  id: string;
  title: string;
  isCompleted: boolean;
}

/**
 * @interface Lesson
 * @property {string} id - Unique identifier for the lesson.
 * @property {string} title - Title of the lesson.
 * @property {string} description - Description of the lesson.
 * @property {string} date - Date of the lesson (e.g., 'YYYY-MM-DD').
 * @property {number} estimatedSessions - Estimated number of sessions for the lesson.
 * @property {string[]} assignedSections - Array of section IDs to which the lesson is assigned.
 * @property {Object.<string, 'planned' | 'in-progress' | 'completed'>} completionStatus - Completion status of the lesson per section.
 * @property {LessonStage[]} stages - Array of stages/phases within the lesson.
 * @property {string} [completionDate] - Optional date when the lesson was completed.
 * @property {string} [courseName] - Optional name of the course this lesson belongs to.
 */
export interface Lesson {
  id: string;
  title: string;
  description: string;
  date: string;
  estimatedSessions: number;
  assignedSections: string[];
  completionStatus: { [sectionId: string]: 'planned' | 'in-progress' | 'completed' };
  stages: LessonStage[];
  completionDate?: string;
  courseName?: string;
}

/**
 * @interface CurriculumContextType
 * @property {Lesson[]} lessons - Array of all lessons.
 * @property {boolean} isLoading - Indicates if data is currently being loaded or modified.
 * @property {(lesson: Omit<Lesson, 'id'>) => Promise<void>} addLesson - Function to add a new lesson.
 * @property {(id: string, updatedData: Partial<Lesson>) => Promise<void>} editLesson - Function to edit an existing lesson.
 * @property {(id: string) => Promise<void>} deleteLesson - Function to delete a lesson.
 * @property {(orderedLessonIds: string[]) => Promise<void>} reorderLessons - Function to reorder lessons.
 */
interface CurriculumContextType {
  lessons: Lesson[];
  isLoading: boolean;
  addLesson: (lesson: Omit<Lesson, 'id'>) => Promise<Lesson>; // Changed from Promise<void>
  editLesson: (id: string, updatedData: Partial<Lesson>) => Promise<Lesson>; // Changed from Promise<void>
  deleteLesson: (id: string) => Promise<void>;
  reorderLessons: (orderedLessonIds: string[]) => Promise<void>;
}

const CurriculumContext = createContext<CurriculumContextType | undefined>(undefined);

/**
 * @interface CurriculumProviderProps
 * @property {ReactNode} children - React children to be rendered within the provider.
 */
interface CurriculumProviderProps {
  children: ReactNode;
}

/**
 * @function CurriculumProvider
 * @param {CurriculumProviderProps} props - Props for the CurriculumProvider component.
 * @returns {JSX.Element} The provider component.
 * @description Provides lesson data and related functions to its children components.
 */
export const CurriculumProvider = ({ children }: CurriculumProviderProps) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * @function loadLessons
   * @description Fetches lessons from the API and updates the state.
   */
  useEffect(() => {
    const loadLessons = async () => {
      setIsLoading(true);
      try {
        const data = await fetchLessons();
        const transformedData = data.map((lesson: any) => ({
          ...lesson,
          stages: lesson.stages ? lesson.stages.map((stage: any) => {
            if (typeof stage === 'object' && stage !== null && 'id' in stage && 'title' in stage && 'isCompleted' in stage) {
              return stage; // Already in LessonStage format
            } else if (typeof stage === 'object' && stage !== null && 'title' in stage) {
              return { id: `stage-${Date.now()}-${Math.random()}`, title: stage.title, isCompleted: false }; // Old LessonStage without isCompleted
            } else if (typeof stage === 'string') {
              return { id: `stage-${Date.now()}-${Math.random()}`, title: stage, isCompleted: false }; // String format
            }
            return { id: `stage-${Date.now()}-${Math.random()}`, title: 'Untitled Stage', isCompleted: false }; // Fallback
          }) : []
        }));
        setLessons(transformedData);
        console.log("Lessons loaded successfully!");
      } catch (error) {
        console.error("Failed to fetch lessons:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadLessons();
  }, []);

  /**
   * @function addLesson
   * @param {Omit<Lesson, 'id'>} lesson - The lesson data to add.
   * @description Adds a new lesson to the curriculum via API and updates the state.
   */
  const addLesson = async (lesson: Omit<Lesson, 'id'>): Promise<Lesson> => {
    setIsLoading(true);
    try {
      const newLesson = await createLesson(lesson);
      if (!newLesson.id) {
        throw new Error("Backend did not return an ID for the new lesson. Cannot add to list.");
      }
      setLessons((prevLessons) => [...prevLessons, newLesson]);
      console.log("Lesson added successfully:", newLesson);
      return newLesson;
    } catch (error) {
      console.error("Failed to add lesson:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * @function editLesson
   * @param {string} id - The ID of the lesson to edit.
   * @param {Partial<Lesson>} updatedData - The updated lesson data.
   * @description Edits an existing lesson via API and updates the state.
   */
  const editLesson = async (id: string, updatedData: Partial<Lesson>): Promise<Lesson> => {
    setIsLoading(true);
    try {
      const updatedLesson = await updateLesson(id, updatedData);
      setLessons((prevLessons) =>
        prevLessons.map((lesson) =>
          lesson.id === id ? updatedLesson : lesson
        )
      );
      console.log("Lesson updated successfully:", updatedLesson);
      return updatedLesson;
    } catch (error) {
      console.error("Failed to edit lesson:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * @function deleteLesson
   * @param {string} id - The ID of the lesson to delete.
   * @description Deletes a lesson via API and updates the state.
   */
  const deleteLesson = async (id: string) => {
    setIsLoading(true);
    try {
      await deleteLessonAPI(id);
      setLessons((prevLessons) => prevLessons.filter((lesson) => lesson.id !== id));
      console.log("Lesson deleted successfully:", id);
    } catch (error) {
      console.error("Failed to delete lesson:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * @function reorderLessons
   * @param {string[]} orderedLessonIds - An array of lesson IDs in the new desired order.
   * @description Reorders lessons locally (optimistic update). API integration for persistence is pending.
   */
  const reorderLessons = async (orderedLessonIds: string[]) => {
    // Optimistic update
  // const originalLessons = [...lessons];
    setLessons(prevLessons => {
      const lessonMap = new Map(prevLessons.map(lesson => [lesson.id, lesson]));
      return orderedLessonIds.map(id => lessonMap.get(id)).filter((lesson): lesson is Lesson => lesson !== undefined);
    });

    // TODO: Implement API call for reordering if backend supports it
    // For now, just reorder locally
    // try {
    //   await updateLessonOrder(orderedLessonIds); // Assuming an API call for reordering
    //   // TODO: Show success toast
    // } catch (error) {
    //   console.error("Failed to reorder lessons:", error);
    //   setLessons(originalLessons); // Revert on error
    //   // TODO: Show error toast
    // } finally {
    //   setIsLoading(false);
    // }
  };

  return (
    <CurriculumContext.Provider value={{
      lessons,
      isLoading,
      addLesson,
      editLesson,
      deleteLesson,
      reorderLessons,
    }}>
      {children}
    </CurriculumContext.Provider>
  );
};

/**
 * @function useCurriculum
 * @description Custom hook to access the CurriculumContext.
 * @returns {CurriculumContextType} The curriculum context value.
 * @throws {Error} If used outside of a CurriculumProvider.
 */
export const useCurriculum = () => {
  const context = useContext(CurriculumContext);
  if (context === undefined) {
    throw new Error('useCurriculum must be used within a CurriculumProvider');
  }
  return context;
};
