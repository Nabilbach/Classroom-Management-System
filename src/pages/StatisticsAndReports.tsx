import React from 'react';
import { Typography } from "@material-tailwind/react";
import AttendanceSummary from '../components/AttendanceSummary';
import GradeDistribution from '../components/GradeDistribution';

function StatisticsAndReports() {
  return (
    <div>
      <Typography variant="h4" color="blue-gray" className="mb-4">
        Statistics & Reports
      </Typography>
      <AttendanceSummary />
      <GradeDistribution />
    </div>
  );
}

export default StatisticsAndReports;
