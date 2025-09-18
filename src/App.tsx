import React from 'react';
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
import SectionProgress from './pages/SectionProgress'; // New import

function App() {
  return (
    <Router>
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
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
                <Route path="/statistics-and-reports" element={<StatisticsAndReports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/assessment-settings" element={<AssessmentSettings />} />
                <Route path="/section-progress/:sectionId" element={<SectionProgress />} /> {/* New Route */}
              </Routes>
            </LessonLogProvider>
          </MainContent>
        </div>
      </div>
    </Router>
  );
}

export default App;