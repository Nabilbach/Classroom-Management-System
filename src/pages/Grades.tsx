import React from 'react';
import GradeTable from '../components/GradeTable';
import AddGradeForm from '../components/AddGradeForm';
import AssignmentForm from '../components/AssignmentForm';
import { useStudents } from '../contexts/StudentsContext';
import { useGrades } from '../contexts/GradeContext'; // Corrected import path
import { Typography } from "@material-tailwind/react";

function Grades() {
  const { students } = useStudents();
  const { assignments, grades, addGrade, addAssignment } = useGrades();

  return (
    <div>
      <Typography variant="h4" color="blue-gray" className="mb-4">
        Grades
      </Typography>
      <AssignmentForm addAssignment={addAssignment} />
      <AddGradeForm students={students} assignments={assignments} addGrade={addGrade} />
      <GradeTable students={students} assignments={assignments} grades={grades} />
    </div>
  );
}

export default Grades;
