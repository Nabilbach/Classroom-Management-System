import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './tajawal-font.css'; // خط Tajawal المُطبق بقوة
import { GradeProvider } from './contexts/GradeContext';
import { AttendanceProvider } from './contexts/AttendanceContext';
import { SectionProvider } from './contexts/SectionsContext';
import { StudentsProvider } from './contexts/StudentsContext';
import { SettingsProvider } from './contexts/SettingsContext'; // New import
import { CurriculumProvider } from './contexts/CurriculumContext'; // Import CurriculumProvider
import { ThemeProvider } from "@material-tailwind/react";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <SettingsProvider>
        <StudentsProvider>
          <SectionProvider>
            <GradeProvider>
              <AttendanceProvider>
                <CurriculumProvider> {/* Wrap with CurriculumProvider */}
                  <App />
                </CurriculumProvider>
              </AttendanceProvider>
            </GradeProvider>
          </SectionProvider>
        </StudentsProvider>
      </SettingsProvider>
    </ThemeProvider>
  </React.StrictMode>
);