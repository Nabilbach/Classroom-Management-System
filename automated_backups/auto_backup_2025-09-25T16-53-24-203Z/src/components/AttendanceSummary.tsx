import React from 'react';
import { Card, Typography } from "@material-tailwind/react";
import { useStudents } from '../contexts/StudentsContext'; // Updated import
import { useAttendance } from '../contexts/AttendanceContext';

function AttendanceSummary() {
  const { students } = useStudents();
  const { attendance } = useAttendance();

  const totalStudents = students.length;
  const presentStudents = Object.values(attendance).filter(status => status === 'Present').length;
  const absentStudents = totalStudents - presentStudents;

  return (
    <Card className="p-4 mb-4">
      <Typography variant="h6" color="blue-gray" className="mb-2">
        Attendance Summary
      </Typography>
      <Typography variant="paragraph" color="blue-gray">
        Total Students: {totalStudents}
      </Typography>
      <Typography variant="paragraph" color="green">
        Present: {presentStudents}
      </Typography>
      <Typography variant="paragraph" color="red">
        Absent: {absentStudents}
      </Typography>
    </Card>
  );
}

export default AttendanceSummary;
