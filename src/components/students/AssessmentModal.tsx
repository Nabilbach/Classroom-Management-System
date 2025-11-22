import { useState, useEffect } from 'react';
import { Dialog, DialogHeader, DialogBody, DialogFooter, Typography, Button, Input, Textarea, IconButton, Checkbox } from "@material-tailwind/react";
import { useStudents } from '../../contexts/StudentsContext';
import { useSettings } from '../../contexts/SettingsContext';

interface AssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string | undefined; // Now accepts studentId
}

function AssessmentModal({ isOpen, onClose, studentId }: AssessmentModalProps) {
  const { editStudent, students } = useStudents();
  const { assessmentElements } = useSettings();

  const student = studentId ? students.find(s => s.id === studentId) : undefined;

  const [scores, setScores] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [featured, setFeatured] = useState(false);

  // Effect to reset state when modal opens or elements change
  useEffect(() => {
    if (isOpen && student) { // Only reset if modal is open and student is valid
      const initialScores: Record<string, string> = {};
      assessmentElements.forEach(element => {
        initialScores[element.id] = ''; // Default to empty
      });
      setScores(initialScores);
      setNotes('');
    }
  }, [isOpen, assessmentElements, student]); // Add student to dependency array

  const handleScoreChange = (elementId: string, value: string) => {
    setScores(prev => ({ ...prev, [elementId]: value }));
  };

  const handleSaveAssessment = () => {
    if (!student) return;

    const newAssessment = {
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      scores: scores,
      notes: notes,
      featured,
    };

    // Note: Badge calculation logic might need adjustment based on new scoring types
    editStudent(student.id, {
      assessments: [...(student.assessments || []), newAssessment],
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} handler={onClose} size="sm">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full text-right">
        <DialogHeader className="justify-end p-0 mb-4">
          <Typography variant="h5" color="blue-gray" className="text-xl font-bold">
            تقييم الطالب: {student?.firstName} {student?.lastName}
          </Typography>
        </DialogHeader>
        <DialogBody divider className="p-0 overflow-y-auto max-h-[calc(100vh-200px)] flex flex-col gap-6">
          <Typography variant="h6" color="blue-gray">عناصر التقييم</Typography>
          
          {assessmentElements.map(element => (
            <div key={element.id}>
              <Typography variant="small" color="blue-gray" className="font-semibold mb-2">{element.name}</Typography>
              
              {/* Conditional Rendering for Element Type */}
              {element.type === 'numeric' ? (
                <Input
                  label={`القيمة (القصوى ${element.maxValue})`}
                  type="number"
                  value={scores[element.id] || ''}
                  onChange={(e) => handleScoreChange(element.id, e.target.value)}
                  max={element.maxValue}
                  crossOrigin={undefined}
                />
              ) : element.type === 'quick_icon' ? (
                <div className="grid grid-cols-4 gap-2 text-center">
                  {(element.icons ?? []).map(icon => (
                    <IconButton 
                      key={icon}
                      variant={scores[element.id] === icon ? "filled" : "outlined"}
                      color="blue-gray"
                      onClick={() => handleScoreChange(element.id, icon)}
                    >
                      <span className="text-2xl">{icon}</span>
                    </IconButton>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
          
          <Textarea label="ملاحظات" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="flex items-center gap-2">
            <Checkbox id="featured" checked={featured} onChange={(e) => setFeatured((e.target as HTMLInputElement).checked)} />
            <label htmlFor="featured" className="text-sm">عمل مميز (Featured work) — +60 XP</label>
          </div>
        </DialogBody>
        <DialogFooter className="justify-start p-0 mt-4">
          <Button variant="text" color="red" onClick={onClose} className="mr-1">
            إلغاء
          </Button>
          <Button variant="gradient" color="green" onClick={handleSaveAssessment}>
            حفظ التقييم
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}

export default AssessmentModal;
