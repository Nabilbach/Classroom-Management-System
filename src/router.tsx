import { createBrowserRouter } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import StudentManagement from './pages/StudentManagement';
import Attendance from './pages/Attendance';
import StatisticsAndReports from './pages/StatisticsAndReports';
import LearningAndProgressHub from './pages/LearningAndProgressHub';
import TextbookPage from './pages/TextbookPage';
import Settings from './pages/Settings';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'students',
        element: <StudentManagement />,
      },
      {
        path: 'attendance',
        element: <Attendance />,
      },
      {
        path: 'statistics',
        element: <StatisticsAndReports />,
      },
      {
        path: 'learning',
        element: <LearningAndProgressHub />,
      },
      {
        path: 'textbook',
        element: <TextbookPage />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
]);
