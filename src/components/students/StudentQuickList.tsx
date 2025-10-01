import React from 'react';
import { Button } from '@mui/material';
import { Student } from '../../types/student';

interface Props {
  students: Student[];
  currentStudentId?: string | number;
  onSelectStudent: (id: number) => void;
}

const StudentQuickList: React.FC<Props> = ({ students, currentStudentId, onSelectStudent }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
        gap: 8,
        alignItems: 'stretch',
        padding: '8px 6px',
        width: '100%',
      }}
    >
      {students.map((s) => {
        const isActive = String(s.id) === String(currentStudentId);
        return (
          <Button
            key={s.id}
            variant={isActive ? 'contained' : 'outlined'}
            size="small"
            onClick={() => onSelectStudent(Number(s.id))}
            style={{
              width: '100%',
              height: 48,
              borderRadius: 10,
              padding: '6px 8px',
              fontWeight: '700',
              fontSize: '0.95rem',
              textTransform: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {s.classOrder}
          </Button>
        );
      })}
    </div>
  );
};

export default StudentQuickList;
