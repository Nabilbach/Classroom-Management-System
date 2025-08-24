import React from 'react';
import { Card, Typography, Button } from "@material-tailwind/react";

interface Student {
  name: string;
}

interface Attendance {
  [studentName: string]: string;
}

interface AttendanceTrackerProps {
  students: Student[];
  attendance: Attendance;
  setAttendance: (studentName: string, status: string) => void;
}

function AttendanceTracker({ students, attendance, setAttendance }: AttendanceTrackerProps) {
  const handleAttendanceChange = (studentName: string, status: string) => {
    setAttendance(studentName, status);
  };

  return (
    <Card className="p-4">
      <Typography variant="h6" color="blue-gray" className="mb-4">
        Attendance Tracker
      </Typography>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Student</th>
            <th className="py-2 px-4 border-b">Status</th>
            <th className="py-2 px-4 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => (
            <tr key={index}>
              <td className="py-2 px-4 border-b">{student.name}</td>
              <td className="py-2 px-4 border-b">
                {attendance[student.name] || 'N/A'}
              </td>
              <td className="py-2 px-4 border-b">
                <Button
                  size="sm"
                  color="green"
                  onClick={() => handleAttendanceChange(student.name, 'Present')}
                  className="mr-2"
                >
                  Present
                </Button>
                <Button
                  size="sm"
                  color="red"
                  onClick={() => handleAttendanceChange(student.name, 'Absent')}
                >
                  Absent
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

export default AttendanceTracker;
