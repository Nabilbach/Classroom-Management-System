import React from 'react';
import { Typography } from "@material-tailwind/react";

function Dashboard() {
  return (
    <div>
      <Typography variant="h4" color="blue-gray" className="mb-4">
        Dashboard
      </Typography>
      <Typography variant="paragraph" color="blue-gray">
        This is the dashboard overview page.
      </Typography>
    </div>
  );
}

export default Dashboard;