import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import TeachersPage from './pages/TeachersPage';
import SectionsPage from './pages/SectionsPage';
import AddTeacherPage from './pages/AddTeacherPage';
import AddSectionPage from './pages/AddSectionPage';
import TeacherDetail from './pages/TeacherDetail';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const handleLogin = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  return (
    <Router>
      <div className="app-container">
        {token && (
          <nav className="sidebar">
            <h2>لوحة التحكم</h2>
            <ul>
              <li><Link to="/">الرئيسية</Link></li>
              <li><Link to="/teachers">الأساتذة</Link></li>
              <li><Link to="/sections">الأقسام</Link></li>
            </ul>
            <button onClick={handleLogout} className="logout-button">تسجيل الخروج</button>
          </nav>
        )}
        <main className="main-content">
          <Routes>
            <Route path="/login" element={token ? <Navigate to="/" /> : <LoginPage onLogin={handleLogin} />} />
            <Route path="/" element={token ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/teachers" element={token ? <TeachersPage /> : <Navigate to="/login" />} />
            <Route path="/teachers/add" element={token ? <AddTeacherPage /> : <Navigate to="/login" />} />
            <Route path="/teachers/:id" element={token ? <TeacherDetail /> : <Navigate to="/login" />} />
            <Route path="/sections" element={token ? <SectionsPage /> : <Navigate to="/login" />} />
            <Route path="/sections/add" element={token ? <AddSectionPage /> : <Navigate to="/login" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
