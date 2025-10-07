import React from 'react';
import { Card } from "@material-tailwind/react";

function StudentTableSkeleton() {
  return (
    <Card className="p-4 animate-pulse">
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-blue-gray-50/50">
              <th className="px-4 py-2 text-left text-blue-gray-900"></th>
              <th className="px-4 py-2 text-left text-blue-gray-900"></th>
              <th className="px-4 py-2 text-left text-blue-gray-900"></th>
              <th className="px-4 py-2 text-left text-blue-gray-900"></th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b border-blue-gray-50">
                <td className="px-4 py-2"><div className="h-4 bg-gray-300 rounded w-3/4"></div></td>
                <td className="px-4 py-2"><div className="h-4 bg-gray-300 rounded w-1/2"></div></td>
                <td className="px-4 py-2"><div className="h-4 bg-gray-300 rounded w-1/4"></div></td>
                <td className="px-4 py-2"><div className="h-4 bg-gray-300 rounded w-1/4"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default StudentTableSkeleton;
