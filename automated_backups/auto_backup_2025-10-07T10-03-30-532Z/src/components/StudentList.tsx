import React from 'react';
import { Card, Typography, List, ListItem } from "@material-tailwind/react";
import { Link } from 'react-router-dom';

interface Student {
  id: string;
  fullName: string;
  trackNumber: number;
  sectionId: string;
  badge: string;
}

interface StudentListProps {
  students: Student[];
}

function StudentList({ students }: StudentListProps) {
  return (
    <Card className="p-4">
      <Typography variant="h6" color="blue-gray" className="mb-4">
        Student List
      </Typography>
      <List>
        {students.map((student) => (
          <Link to={`/student/${student.fullName}`} key={student.id}>
            <ListItem>
              {student.fullName}
            </ListItem>
          </Link>
        ))}
      </List>
    </Card>
  );
}

export default StudentList;
