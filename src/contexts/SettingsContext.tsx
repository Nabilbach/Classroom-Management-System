import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface AssessmentElement {
  id: string;
  name: string;
  type: 'numeric' | 'grade' | 'scale' | 'quick_icon'; // Added 'quick_icon'
  maxValue?: number;
  icons?: string[]; // Added optional icons array
}

interface SettingsContextType {
  assessmentElements: AssessmentElement[];
  addAssessmentElement: (element: Omit<AssessmentElement, 'id'>) => void;
  updateAssessmentElement: (id: string, updatedData: Partial<AssessmentElement>) => void;
  deleteAssessmentElement: (id: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [assessmentElements, setAssessmentElements] = useState<AssessmentElement[]>(() => {
    const savedElements = localStorage.getItem('assessmentElements');
    return savedElements ? JSON.parse(savedElements) : [
      { id: '1', name: 'المشاركة', type: 'numeric', maxValue: 5 },
      { id: '2', name: 'الواجبات', type: 'numeric', maxValue: 5 },
      { id: '3', name: 'الاختبارات القصيرة', type: 'numeric', maxValue: 5 },
    ];
  });

  useEffect(() => {
    localStorage.setItem('assessmentElements', JSON.stringify(assessmentElements));
  }, [assessmentElements]);

  const addAssessmentElement = (element: Omit<AssessmentElement, 'id'>) => {
    const newElement = { ...element, id: Date.now().toString() };
    setAssessmentElements((prevElements) => [...prevElements, newElement]);
  };

  const updateAssessmentElement = (id: string, updatedData: Partial<AssessmentElement>) => {
    setAssessmentElements((prevElements) =>
      prevElements.map((el) => (el.id === id ? { ...el, ...updatedData } : el))
    );
  };

  const deleteAssessmentElement = (id: string) => {
    setAssessmentElements((prevElements) => prevElements.filter((el) => el.id !== id));
  };

  return (
    <SettingsContext.Provider value={{
      assessmentElements,
      addAssessmentElement,
      updateAssessmentElement,
      deleteAssessmentElement,
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
