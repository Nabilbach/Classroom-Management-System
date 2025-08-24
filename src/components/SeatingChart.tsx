import React, { useState, useEffect } from 'react';
import { Card, Typography, Button } from "@material-tailwind/react";
import { useStudents } from '../context/StudentContext';

const NUM_ROWS = 4;
const NUM_COLS = 4;

interface Student {
  name: string;
}

function SeatingChart() {
  const { students } = useStudents();

  const [desks, setDesks] = useState<Array<string | null>>(() => {
    const savedDesks = localStorage.getItem('seatingChartDesks');
    return savedDesks ? JSON.parse(savedDesks) : Array(NUM_ROWS * NUM_COLS).fill(null);
  });

  const [unassignedStudents, setUnassignedStudents] = useState<string[]>(() => {
    const savedUnassigned = localStorage.getItem('seatingChartUnassigned');
    if (savedUnassigned) {
      return JSON.parse(savedUnassigned);
    } else {
      // Initialize unassigned students with all students if no saved state
      return students.map(s => s.name);
    }
  });

  useEffect(() => {
    localStorage.setItem('seatingChartDesks', JSON.stringify(desks));
  }, [desks]);

  useEffect(() => {
    localStorage.setItem('seatingChartUnassigned', JSON.stringify(unassignedStudents));
  }, [unassignedStudents]);

  const handleDragStart = (e: React.DragEvent, studentName: string) => {
    e.dataTransfer.setData("studentName", studentName);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, deskIndex: number) => {
    e.preventDefault();
    const studentName = e.dataTransfer.getData("studentName");

    // Find if the student is already on a desk
    const currentDeskIndex = desks.findIndex(s => s === studentName);

    setDesks(prevDesks => {
      const newDesks = [...prevDesks];
      // If student is moving from another desk
      if (currentDeskIndex !== -1) {
        newDesks[currentDeskIndex] = null; // Clear old desk
      }
      // If target desk is occupied, move its student to unassigned
      if (newDesks[deskIndex] !== null) {
        setUnassignedStudents(prevUnassigned => [...prevUnassigned, newDesks[deskIndex] as string]);
      }
      newDesks[deskIndex] = studentName; // Place student on new desk
      return newDesks;
    });

    // Remove student from unassigned list if they were there
    setUnassignedStudents(prevUnassigned => prevUnassigned.filter(s => s !== studentName));
  };

  const handleRemoveFromDesk = (studentName: string, deskIndex: number) => {
    setDesks(prevDesks => {
      const newDesks = [...prevDesks];
      newDesks[deskIndex] = null;
      return newDesks;
    });
    setUnassignedStudents(prevUnassigned => [...prevUnassigned, studentName]);
  };

  const handleResetSeatingChart = () => {
    setDesks(Array(NUM_ROWS * NUM_COLS).fill(null));
    setUnassignedStudents(students.map(s => s.name));
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <Typography variant="h6" color="blue-gray">
          Seating Chart
        </Typography>
        <Button color="red" size="sm" onClick={handleResetSeatingChart}>
          Reset Seating Chart
        </Button>
      </div>

      <div className="flex">
        {/* Unassigned Students List */}
        <div className="w-1/4 p-2 border-r">
          <Typography variant="h6" color="blue-gray" className="mb-2">Unassigned Students</Typography>
          <div className="space-y-2">
            {unassignedStudents.map((studentName, index) => (
              <Card
                key={index}
                className="p-2 cursor-grab bg-blue-gray-50"
                draggable
                onDragStart={(e) => handleDragStart(e, studentName)}
              >
                <Typography variant="paragraph">{studentName}</Typography>
              </Card>
            ))}
          </div>
        </div>

        {/* Seating Grid */}
        <div className="w-3/4 p-2">
          <Typography variant="h6" color="blue-gray" className="mb-2">Classroom Layout</Typography>
          <div
            className="grid gap-4 p-4 border"
            style={{
              gridTemplateColumns: `repeat(${NUM_COLS}, 1fr)`,
              gridTemplateRows: `repeat(${NUM_ROWS}, 1fr)`,
            }}
          >
            {desks.map((studentName, index) => (
              <div
                key={index}
                className="border border-dashed p-4 flex items-center justify-center h-24 relative"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
              >
                {studentName ? (
                  <Card className="p-2 bg-light-blue-50">
                    <Typography variant="paragraph">{studentName}</Typography>
                    <Button
                      size="sm"
                      color="red"
                      className="absolute top-1 right-1 p-1"
                      onClick={() => handleRemoveFromDesk(studentName, index)}
                    >
                      X
                    </Button>
                  </Card>
                ) : (
                  <Typography variant="small" color="blue-gray">Drag student here</Typography>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default SeatingChart;
