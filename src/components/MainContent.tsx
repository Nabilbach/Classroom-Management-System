import React from 'react';
import { Card } from "@material-tailwind/react";

interface MainContentProps {
  children: React.ReactNode;
}

function MainContent({ children }: MainContentProps) {
  return (
    <main className="flex-1 min-h-0 pl-6 pr-0 bg-gray-100 flex flex-col" dir="rtl">
      <Card className="p-6 shadow-md flex-1 min-h-0 overflow-y-auto">
        {children}
      </Card>
    </main>
  );
}

export default MainContent;
