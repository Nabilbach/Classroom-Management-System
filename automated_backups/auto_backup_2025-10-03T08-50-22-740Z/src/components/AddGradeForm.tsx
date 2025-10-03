import React, { useState } from 'react';
import { Input, Button, Card, Typography, Select, Option } from "@material-tailwind/react";

interface Student {
  name: string;
}

interface AddGradeFormProps {
  students: Student[];
  assignments: string[];
  addGrade: (studentName: string, assignmentName: string, gradeValue: string) => void;
}

function AddGradeForm({ students, assignments, addGrade }: AddGradeFormProps) {
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedAssignment, setSelectedAssignment] = useState<string>('');
  const [grade, setGrade] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedAssignment || !grade.trim()) return;
    addGrade(selectedStudent, selectedAssignment, grade);
    setGrade('');
  };

  return (
    <Card className="p-4 mb-4">
      <Typography variant="h6" color="blue-gray" className="mb-4">
        Add Grade
      </Typography>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <Select
            label="Select Student"
            value={selectedStudent}
            onChange={(value) => setSelectedStudent(value as string)}
          >
            {students.map((student, index) => (
              <Option key={index} value={student.name}>{student.name}</Option>
            ))}
          </Select>
        </div>
        <div className="mb-4">
          <Select
            label="Select Assignment"
            value={selectedAssignment}
            onChange={(value) => setSelectedAssignment(value as string)}
          >
            {assignments.map((assignment, index) => (
              <Option key={index} value={assignment}>{assignment}</Option>
            ))}
          </Select>
        </div>
        <div className="mb-4">
          <Input
            type="text"
            label="Grade"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
          />
        </div>
        <Button type="submit" fullWidth>
          Add Grade
        </Button>
      </form>
    </Card>
  );
}

export default AddGradeForm;
