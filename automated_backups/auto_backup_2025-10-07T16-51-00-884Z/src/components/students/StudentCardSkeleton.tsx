import React from 'react';
import { Card } from "@material-tailwind/react";

function StudentCardSkeleton() {
  return (
    <Card className="p-4 shadow-md rounded-lg animate-pulse">
      <div className="flex justify-between items-start mb-2">
        <div className="h-6 bg-gray-300 rounded w-3/4"></div>
        <div className="flex gap-2">
          <div className="h-6 w-6 bg-gray-300 rounded-full"></div>
          <div className="h-6 w-6 bg-gray-300 rounded-full"></div>
          <div className="h-6 w-6 bg-gray-300 rounded-full"></div>
        </div>
      </div>
      <div className="h-4 bg-gray-300 rounded w-1/2 mb-1"></div>
      <div className="flex items-center">
        <div className="h-4 bg-gray-300 rounded w-1/4 mr-2"></div>
        <div className="h-6 bg-gray-300 rounded-full w-1/4"></div>
      </div>
    </Card>
  );
}

export default StudentCardSkeleton;
