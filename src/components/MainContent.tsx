import React from 'react';
import { Card } from "@material-tailwind/react";

interface MainContentProps {
  children: React.ReactNode;
}

function MainContent({ children }: MainContentProps) {
  return (
  <main className="flex-1 min-h-0 bg-gray-100 flex flex-col w-full" dir="rtl">
      <Card className="shadow-md flex-1 min-h-0 overflow-y-auto w-full">
        <div className="p-2">
          {children}
        </div>
      </Card>
    </main>
  );
}

export default MainContent;
