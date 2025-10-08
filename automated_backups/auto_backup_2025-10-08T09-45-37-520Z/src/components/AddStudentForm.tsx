import React, { useState } from 'react';
import { Input, Button, Card, Typography } from "@material-tailwind/react";

interface AddStudentFormProps {
  addStudent: (student: { fullName: string; trackNumber: number; sectionId: string; badge: string }) => void;
}

function AddStudentForm({ addStudent }: AddStudentFormProps) {
  const [fullName, setFullName] = useState<string>('');
  const [trackNumber, setTrackNumber] = useState<string>('');
  const [sectionId, setSectionId] = useState<string>('');
  const [badge, setBadge] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !trackNumber.trim() || !sectionId.trim() || !badge.trim()) {
      setError('All fields are required.');
      return;
    }
    setError('');
    addStudent({ fullName, trackNumber: parseInt(trackNumber), sectionId, badge });
    setFullName('');
    setTrackNumber('');
    setSectionId('');
    setBadge('');
  };

  return (
    <Card className="p-4 mb-4">
      <Typography variant="h6" color="blue-gray" className="mb-4">
        Add New Student
      </Typography>
      <form onSubmit={handleSubmit} className="flex gap-2 flex-col md:flex-row">
        <div className="flex-grow">
          <Input
            type="text"
            label="Full Name"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (error) setError('');
            }}
            fullWidth
            error={!!error}
          />
          <Input
            type="number"
            label="Track Number"
            value={trackNumber}
            onChange={(e) => {
              setTrackNumber(e.target.value);
              if (error) setError('');
            }}
            fullWidth
            error={!!error}
          />
          <Input
            type="text"
            label="Section ID"
            value={sectionId}
            onChange={(e) => {
              setSectionId(e.target.value);
              if (error) setError('');
            }}
            fullWidth
            error={!!error}
          />
          <Input
            type="text"
            label="Badge"
            value={badge}
            onChange={(e) => {
              setBadge(e.target.value);
              if (error) setError('');
            }}
            fullWidth
            error={!!error}
          />
          {error && <Typography variant="small" color="red" className="mt-1">{error}</Typography>}
        </div>
        <Button type="submit" className="md:w-auto">
          Add Student
        </Button>
      </form>
    </Card>
  );
}

export default AddStudentForm;
