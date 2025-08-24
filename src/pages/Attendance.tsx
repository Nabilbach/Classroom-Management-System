import React from 'react';
import AttendanceTracker from '../components/AttendanceTracker';
import { useStudents } from '../contexts/StudentsContext';
import { useAttendance } from '../contexts/AttendanceContext'; // Corrected import path
import { Typography } from "@material-tailwind/react";

function Attendance() {
  const { students } = useStudents();
  const { attendance, updateAttendance } = useAttendance();

  return (
    <div>
      <Typography variant="h4" color="blue-gray" className="mb-4">
        Attendance
      </Typography>
      <AttendanceTracker students={students} attendance={attendance} setAttendance={updateAttendance} />
    </div>
  );
}

export default Attendance;