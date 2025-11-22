// React import not required with new JSX transform
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MainContent from './components/MainContent';
import BackupStatusIndicator from './components/BackupStatusIndicator';
import { usePreventSleepReload } from './hooks/usePreventSleepReload';
import ConnectionStatus from './components/layout/ConnectionStatus';
import RestoreNotice from './components/layout/RestoreNotice';
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

import PresentationModeBanner from './components/layout/PresentationModeBanner';

function App() {
  // Activate soft reconnect/sleep-resume protection
  usePreventSleepReload();

  const [isPresentationMode, setIsPresentationMode] = React.useState(false);

  React.useEffect(() => {
    fetch('http://localhost:3000/api/config')
      .then(res => res.json())
      .then(data => {
        if (data.presentationMode) {
          setIsPresentationMode(true);
        }
      })
      .catch(err => console.error('Failed to fetch config:', err));
  }, []);

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <BackupStatusIndicator />
      <PresentationModeBanner isVisible={isPresentationMode} />
      {/* Connection status indicator (shows briefly on disconnect/restore) */}
      <ConnectionStatus />
      <RestoreNotice />
      {/* eslint-disable-next-line react/style-prop-object */}
      <div className="flex h-screen w-full overflow-x-hidden reserve-sidebar-space" dir="rtl">
        {/* Main content first, sidebar on the right */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 w-full transition-all duration-300 pb-12"> {/* Added pb-12 for banner space */}
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