import React from 'react';
import { Typography, Card, CardBody } from "@material-tailwind/react";
import { useCurriculum } from '../contexts/CurriculumContext';
import { calculateCompletionPercentage } from '../utils/curriculumUtils';

interface ProgressStatsCardProps {
  sectionId: string;
  sectionName: string;
}

function ProgressStatsCard({ sectionId, sectionName }: ProgressStatsCardProps) {
  const { lessons } = useCurriculum();

  const completionPercentage = calculateCompletionPercentage(lessons, sectionId);

  const completedLessonsCount = lessons.filter(
    lesson => lesson.assignedSections && lesson.assignedSections.includes(sectionId) && lesson.completionStatus[sectionId] === 'completed'
  ).length;

  const totalAssignedLessonsCount = lessons.filter(
    lesson => lesson.assignedSections && lesson.assignedSections.includes(sectionId)
  ).length;

  return (
    <Card className="p-4 text-right">
      <CardBody className="p-0">
        <Typography variant="h6" color="blue-gray" className="mb-2">
          {sectionName}
        </Typography>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
        <Typography variant="small" color="blue-gray" className="font-semibold">
          {completionPercentage.toFixed(0)}%
        </Typography>
        <Typography variant="small" color="gray">
          {completedLessonsCount}/{totalAssignedLessonsCount} درس مكتمل
        </Typography>
      </CardBody>
    </Card>
  );
}

export default ProgressStatsCard;
