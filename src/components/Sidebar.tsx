import React from 'react';
import { Link } from 'react-router-dom';
import { Typography, Button } from "@material-tailwind/react";

function Sidebar() {
  return (
    <div className="w-64 h-screen bg-gray-800 text-white p-4">
      <Typography variant="h5" color="white" className="mb-6">
        Classroom App
      </Typography>
      <nav className="mt-10">
        <Link to="/">
          <Button variant="text" color="white" fullWidth className="justify-start mb-2">
            Dashboard
          </Button>
        </Link>
        <Link to="/student-management">
          <Button variant="text" color="white" fullWidth className="justify-start mb-2">
            Student Management
          </Button>
        </Link>
        <Link to="/section-management">
          <Button variant="text" color="white" fullWidth className="justify-start mb-2">
            Section Management
          </Button>
        </Link>
        <Link to="/learning-management">
          <Button variant="text" color="white" fullWidth className="justify-start mb-2">
            Learning Management
          </Button>
        </Link>
        <Link to="/schedule">
          <Button variant="text" color="white" fullWidth className="justify-start mb-2">
            Schedule
          </Button>
        </Link>
        <Link to="/statistics-and-reports">
          <Button variant="text" color="white" fullWidth className="justify-start mb-2">
            Statistics & Reports
          </Button>
        </Link>
        <Link to="/settings">
          <Button variant="text" color="white" fullWidth className="justify-start mb-2">
            Settings
          </Button>
        </Link>
        <Link to="/assessment-settings">
          <Button variant="text" color="white" fullWidth className="justify-start mb-2">
            Assessment Settings
          </Button>
        </Link>
      </nav>
    </div>
  );
}

export default Sidebar;
