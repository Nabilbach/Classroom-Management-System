import React from 'react';
import { Typography } from "@material-tailwind/react";
import SeatingChartComponent from '../components/SeatingChart';
import { useStudents } from '../contexts/StudentsContext'; // Updated import

function SeatingChart() {
  const { students } = useStudents(); // Added useStudents here

  return (
    <div>
      <Typography variant="h4" color="blue-gray" className="mb-4">
        Seating Chart
      </Typography>
      <SeatingChartComponent />
    </div>
  );
}

export default SeatingChart;
