import React from 'react';
import { Card, CardContent, Skeleton } from '@mui/material';

const LessonLogCardSkeleton: React.FC = () => {
  return (
    <Card className="p-4 flex flex-col">
      <CardContent className="flex-grow">
        <Skeleton variant="text" width="80%" height={30} className="mb-2" />
        <Skeleton variant="text" width="60%" height={20} />
        <Skeleton variant="text" width="90%" height={20} />
        <Skeleton variant="text" width="70%" height={20} />
      </CardContent>
      <div className="p-4 pt-0 text-left">
        <Skeleton variant="circular" width={40} height={40} />
      </div>
    </Card>
  );
};

export default LessonLogCardSkeleton;
