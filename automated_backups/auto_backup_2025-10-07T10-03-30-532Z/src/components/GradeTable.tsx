import React from 'react';
import { Card, Typography } from "@material-tailwind/react";

interface Student {
  name: string;
}

interface Grades {
  [studentName: string]: {
    [assignmentName: string]: string;
  };
}

interface GradeTableProps {
  students: Student[];
  assignments: string[];
  grades: Grades;
}

function GradeTable({ students, assignments, grades }: GradeTableProps) {
  return (
    <Card className="p-4 overflow-x-auto">
      <Typography variant="h6" color="blue-gray" className="mb-4">
        Gradebook
      </Typography>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Student</th>
            {assignments.map((assignment, index) => (
              <th key={index} className="py-2 px-4 border-b">{assignment}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map((student, studentIndex) => (
            <tr key={studentIndex}>
              <td className="py-2 px-4 border-b">{student.name}</td>
              {assignments.map((assignment, assignmentIndex) => (
                <td key={assignmentIndex} className="py-2 px-4 border-b">
                  {grades[student.name]?.[assignment] || '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

export default GradeTable;