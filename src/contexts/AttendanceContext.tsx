import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface Attendance {
  [studentName: string]: string;
}

interface AttendanceContextType {
  attendance: Attendance;
  updateAttendance: (studentName: string, status: string) => void;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

interface AttendanceProviderProps {
  children: ReactNode;
}

export const AttendanceProvider = ({ children }: AttendanceProviderProps) => {
  const [attendance, setAttendance] = useState<Attendance>(() => {
    const savedAttendance = localStorage.getItem('attendance');
    return savedAttendance ? JSON.parse(savedAttendance) : {};
  });

  useEffect(() => {
    localStorage.setItem('attendance', JSON.stringify(attendance));
  }, [attendance]);

  const updateAttendance = (studentName: string, status: string) => {
    setAttendance((prevAttendance) => ({
      ...prevAttendance,
      [studentName]: status,
    }));
  };

  return (
    <AttendanceContext.Provider value={{ attendance, updateAttendance }}>
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (context === undefined) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};