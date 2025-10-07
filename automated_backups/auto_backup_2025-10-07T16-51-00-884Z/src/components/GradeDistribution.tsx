import React from 'react';
import { Card, Typography, List, ListItem } from "@material-tailwind/react";
import { useStudents } from '../contexts/StudentsContext'; // Updated import
import { useGrades } from '../contexts/GradeContext';

interface Student {
  name: string;
}

interface Grades {
  [studentName: string]: {
    [assignmentName: string]: string;
  };
}

function GradeDistribution() {
  const { students } = useStudents();
  const { assignments, grades } = useGrades();

  const calculateAverage = (assignment: string) => {
    let total = 0;
    let count = 0;
    students.forEach(student => {
      const grade = grades[student.fullName]?.[assignment]; // Changed to fullName
      if (grade && !isNaN(parseFloat(grade))) {
        total += parseFloat(grade);
        count++;
      }
    });
    return count > 0 ? (total / count).toFixed(2) : 'N/A';
  };

  return (
    <Card className="p-4">
      <Typography variant="h6" color="blue-gray" className="mb-2">
        Grade Distribution
      </Typography>
      <List>
        {assignments.map((assignment, index) => (
          <ListItem key={index}>
            <Typography variant="paragraph" color="blue-gray">
              {assignment}: Average Grade - {calculateAverage(assignment)}
            </Typography>
          </ListItem>
        ))}
      </List>
    </Card>
  );
}

export default GradeDistribution;
