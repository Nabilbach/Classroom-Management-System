import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode; // Optional icon component
  color?: string; // Optional color for the card or value
}

function KpiCard({ title, value, icon, color = "blue-gray" }: KpiCardProps) {
  return (
    <Card className="w-full shadow-lg">
      <CardContent className="p-4 text-center">
        {icon && <div className={`mb-2 text-${color}-500 mx-auto`}>{icon}</div>}
        <Typography variant="h6" color="textPrimary" className="font-bold mb-1">
          {title}
        </Typography>
        <Typography variant="h4" color="inherit" className="font-bold">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default KpiCard;
