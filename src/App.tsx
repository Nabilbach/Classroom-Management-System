import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MainContent from './components/MainContent';
import { LessonLogProvider } from './contexts/LessonLogContext';

// Pages
import Dashboard from './pages/Dashboard';
import LearningAndProgressHub from './pages/LearningAndProgressHub';
import StudentManagement from './pages/StudentManagement';
import SectionManagement from './pages/SectionManagement';
import LessonLog from './pages/LearningManagement';
import Schedule from './pages/Schedule';
import StatisticsAndReports from './pages/StatisticsAndReports';
import Settings from './pages/Settings';
import AssessmentSettings from './pages/AssessmentSettings';
import SectionProgress from './pages/SectionProgress';
import TextbookPage from './pages/TextbookPageSimple';

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <div className="flex h-screen w-full overflow-x-hidden" dir="rtl">
        {/* Main content first, sidebar on the right */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 w-full transition-all duration-300" style={{ marginRight: 'var(--sidebar-width, 260px)' }}>
          <Header />
          <MainContent>
            <LessonLogProvider>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/student-management" element={<StudentManagement />} />
                <Route path="/learning-progress" element={<LearningAndProgressHub />} />
                <Route path="/section-management" element={<SectionManagement />} />
                <Route path="/learning-management" element={<LessonLog />} />
                <Route path="/schedule" element={<Schedule />} />
                <Route path="/textbook" element={<TextbookPage />} />
                <Route path="/statistics-and-reports" element={<StatisticsAndReports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/assessment-settings" element={<AssessmentSettings />} />
                <Route path="/section-progress/:sectionId" element={<SectionProgress />} /> {/* New Route */}
              </Routes>
            </LessonLogProvider>
          </MainContent>
        </div>
        <Sidebar />
      </div>
    </Router>
  );
}

export default App;