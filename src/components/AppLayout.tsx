import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import BackupStatusIndicator from './BackupStatusIndicator';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const activePage = location.pathname.substring(1) || 'dashboard'; // Remove leading slash, default to 'dashboard'

  const handleNavigate = (page: string) => {
    navigate(`/${page}`);
  };

  return (
    <div dir="rtl" className="relative h-screen bg-gray-50 flex overflow-hidden">
      <BackupStatusIndicator />
      {/* The Sidebar is fixed on the right */}
      <div className="fixed top-0 right-0 h-full z-30">
        <Sidebar
          activePage={activePage}
          onNavigate={handleNavigate}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      {/* Main content area with a margin on the right that adjusts based on sidebar state */}
      <main
        className={`flex-1 transition-all duration-300 ease-in-out flex flex-col overflow-hidden ${
          isSidebarCollapsed ? 'mr-20' : 'mr-64'
        }`}
      >
        <Header />
        <div className="p-4 md:p-6 flex-1 overflow-y-auto">
            <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
