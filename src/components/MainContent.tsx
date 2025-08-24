import React from 'react';
import { Card } from "@material-tailwind/react";

interface MainContentProps {
  children: React.ReactNode;
}

function MainContent({ children }: MainContentProps) {
  return (
    <main className="flex-1 p-6 bg-gray-100">
      <Card className="p-6 shadow-md">
        {children}
      </Card>
    </main>
  );
}

export default MainContent;
