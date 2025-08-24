import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { fetchLessonLogs, createLessonLog, updateLessonLog, deleteLessonLog, LessonLog } from '../services/api/lessonLogService';

interface LessonLogContextType {
  lessonLogs: LessonLog[];
  isLoading: boolean;
  addLessonLog: (log: Omit<LessonLog, 'id'>) => Promise<LessonLog>; // Changed from Promise<void>
  editLessonLog: (id: string, updatedData: Partial<LessonLog>) => Promise<LessonLog>; // Changed from Promise<void>
  removeLessonLog: (id: string) => Promise<void>;
}

const LessonLogContext = createContext<LessonLogContextType | undefined>(undefined);

interface LessonLogProviderProps {
  children: ReactNode;
}

export const LessonLogProvider = ({ children }: LessonLogProviderProps) => {
  const [lessonLogs, setLessonLogs] = useState<LessonLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const loadLessonLogs = async () => {
      setIsLoading(true);
      try {
        const data = await fetchLessonLogs();
        setLessonLogs(data);
      } catch (error) {
        console.error("Failed to fetch lesson logs:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadLessonLogs();
  }, []);

  const addLessonLog = async (log: Omit<LessonLog, 'id'>) => {
    setIsLoading(true);
    try {
      const newLog = await createLessonLog(log);
      setLessonLogs((prevLogs) => [...prevLogs, newLog]);
    } catch (error) {
      console.error("Failed to add lesson log:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const editLessonLog = async (id: string, updatedData: Partial<LessonLog>) => {
    setIsLoading(true);
    try {
      const updatedLog = await updateLessonLog(id, updatedData);
      setLessonLogs((prevLogs) =>
        prevLogs.map((log) => (log.id === id ? updatedLog : log))
      );
    } catch (error) {
      console.error("Failed to edit lesson log:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeLessonLog = async (id: string) => {
    setIsLoading(true);
    try {
      await deleteLessonLog(id);
      setLessonLogs((prevLogs) => prevLogs.filter((log) => log.id !== id));
    } catch (error) {
      console.error("Failed to delete lesson log:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LessonLogContext.Provider value={{
      lessonLogs,
      isLoading,
      addLessonLog,
      editLessonLog,
      removeLessonLog,
    }}>
      {children}
    </LessonLogContext.Provider>
  );
};

export const useLessonLog = () => {
  const context = useContext(LessonLogContext);
  if (context === undefined) {
    throw new Error('useLessonLog must be used within a LessonLogProvider');
  }
  return context;
};
