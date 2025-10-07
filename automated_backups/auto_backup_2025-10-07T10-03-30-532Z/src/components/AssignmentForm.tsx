import React, { useState } from 'react';
import { Input, Button, Card, Typography } from "@material-tailwind/react";

interface AssignmentFormProps {
  addAssignment: (assignmentName: string) => void;
}

function AssignmentForm({ addAssignment }: AssignmentFormProps) {
  const [assignmentName, setAssignmentName] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentName.trim()) {
      setError('Assignment name cannot be empty.');
      return;
    }
    setError('');
    addAssignment(assignmentName);
    setAssignmentName('');
  };

  return (
    <Card className="p-4 mb-4">
      <Typography variant="h6" color="blue-gray" className="mb-4">
        Add New Assignment
      </Typography>
      <form onSubmit={handleSubmit} className="flex gap-2 flex-col md:flex-row">
        <div className="flex-grow">
          <Input
            type="text"
            label="Assignment Name"
            value={assignmentName}
            onChange={(e) => {
              setAssignmentName(e.target.value);
              if (error) setError(''); // Clear error on change
            }}
            fullWidth
            error={!!error}
          />
          {error && <Typography variant="small" color="red" className="mt-1">{error}</Typography>}
        </div>
        <Button type="submit" className="md:w-auto">
          Add Assignment
        </Button>
      </form>
    </Card>
  );
}

export default AssignmentForm;
