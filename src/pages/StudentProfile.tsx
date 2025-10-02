import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Card, CardBody, Progress, Button, Slider, Textarea, List, ListItem } from "@material-tailwind/react";

interface StudentProfileParams {
  studentId: string;
}

function StudentProfile() {
  const { studentId } = useParams<keyof StudentProfileParams>() as StudentProfileParams;
  const [student, setStudent] = useState<any>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [currentScore, setCurrentScore] = useState(0);
  const [newScore, setNewScore] = useState(0);
  const [notes, setNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchStudentData();
    fetchAssessments();
  }, [studentId]);

  const fetchStudentData = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/students/${studentId}`);
      const data = await response.json();
      setStudent(data);
      if (data && data.score) {
        setCurrentScore(data.score);
        setNewScore(data.score);
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    }
  };

  const fetchAssessments = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/students/${studentId}/assessments`);
      const data = await response.json();
      setAssessments(data);
    } catch (error) {
      console.error('Error fetching assessments:', error);
    }
  };

  const handleSaveAssessment = async () => {
    try {
      await fetch(`http://localhost:3000/api/students/${studentId}/assessment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ new_score: newScore, notes }),
      });
      setIsEditing(false);
      fetchStudentData();
      fetchAssessments();
    } catch (error) {
      console.error('Error saving assessment:', error);
    }
  };

  if (!student) {
    return <Typography variant="h5" color="red">Student not found.</Typography>;
  }

  return (
    <div>
      <Typography variant="h4" color="blue-gray" className="mb-4">
        Student Profile: {student.first_name} {student.last_name}
      </Typography>

      <Card className="mb-4">
        <CardBody>
          <Typography variant="h6" color="blue-gray" className="mb-2">معلومات الطالب</Typography>
          <Typography>الاسم الكامل: {student.first_name} {student.last_name}</Typography>
          <Typography>رقم التتبع: {student.pathway_number}</Typography>
          {/* Add other student details here */}
        </CardBody>
      </Card>

      <Card className="mb-4">
        <CardBody>
          <Typography variant="h6" color="blue-gray" className="mb-2">التقييم الحالي</Typography>
          <div className="w-full">
            <div className="mb-2 flex items-center justify-between gap-4">
              <Typography color="blue" variant="h6">{isEditing ? newScore.toFixed(1) : currentScore.toFixed(1)} / 10</Typography>
            </div>
            {isEditing ? (
              <Slider value={newScore} onChange={(value) => setNewScore(value)} min={0} max={10} step={0.1} />
            ) : (
              <Progress value={currentScore * 10} />
            )}
          </div>
          {isEditing && (
            <div className="mt-4">
              <Textarea label="ملاحظات" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          )}
          <div className="mt-4">
            {isEditing ? (
              <Button onClick={handleSaveAssessment}>حفظ</Button>
            ) : (
              <Button onClick={() => setIsEditing(true)}>تعديل التقييم</Button>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Typography variant="h6" color="blue-gray" className="mb-2">سجل التقييمات</Typography>
          <List>
            {assessments.map((assessment) => (
              <ListItem key={assessment.id}>
                {new Date(assessment.date).toISOString().slice(0,10)}: 
                Score changed from {assessment.old_score} to {assessment.new_score} (Change: {assessment.score_change}). 
                Notes: {assessment.notes}
              </ListItem>
            ))}
          </List>
        </CardBody>
      </Card>
    </div>
  );
}

export default StudentProfile;
