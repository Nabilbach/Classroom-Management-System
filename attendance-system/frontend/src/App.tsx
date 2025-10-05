import React from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import AttendancePage from './pages/AttendancePage';
import LoginPage from './pages/LoginPage';

function App() {
  // مصادقة وهمية (للتجريب فقط)
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={() => setIsAuthenticated(true)} />} />
        <Route path="/" element={isAuthenticated ? <AttendancePage /> : <Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
