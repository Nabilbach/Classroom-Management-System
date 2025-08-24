import React, { useState } from 'react';
import { Dialog, DialogHeader, DialogBody, DialogFooter, Typography, Button, Tabs, TabsHeader, Tab, Card, CardBody } from "@material-tailwind/react";
import { useSections } from '../../contexts/SectionsContext';
import { useSettings } from '../../contexts/SettingsContext';

interface AssessmentRecord {
  date: string;
  scores: { [elementId: string]: string };
  notes: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  trackNumber: string;
  sectionId: string;
  gender: string;
  dateOfBirth: string;
  studentNumberInSection?: number; // Changed to optional
  badge: string;
  assessments?: AssessmentRecord[];
}

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onAssess: (student: Student) => void;
}

function StudentDetailModal({ isOpen, onClose, student, onAssess }: StudentDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'assessments'>('overview');
  const { sections } = useSections();
  const { assessmentElements } = useSettings();

  if (!student) return null;

  const section = sections.find(s => s.id === student.sectionId);

  return (
    <Dialog open={isOpen} handler={onClose} size="md">
      <DialogHeader>تفاصيل الطالب: {student.firstName} {student.lastName}</DialogHeader>
      <DialogBody divider>
        <Tabs value={activeTab}>
          <TabsHeader>
            <Tab value="overview" onClick={() => setActiveTab('overview')}>نظرة عامة</Tab>
            <Tab value="assessments" onClick={() => setActiveTab('assessments')}>التقييمات</Tab>
          </TabsHeader>
        </Tabs>

        {activeTab === 'overview' && (
          <div className="p-4">
            <Typography variant="h6" color="blue-gray" className="mb-2">معلومات الطالب</Typography>
            <Typography>الاسم الكامل: {student.firstName} {student.lastName}</Typography>
            <Typography>رمز مسار: {student.trackNumber}</Typography>
            <Typography>القسم: {section ? section.name : 'غير محدد'}</Typography>
            <Typography>النوع: {student.gender}</Typography>
            <Typography>تاريخ الازدياد: {student.dateOfBirth}</Typography>
            {/* Removed studentNumberInSection display */}
            <Typography>الشارة: {student.badge}</Typography>
          </div>
        )}

        {activeTab === 'assessments' && (
          <div className="p-4">
            <Typography variant="h6" color="blue-gray" className="mb-2">التقييمات السابقة</Typography>
            {student.assessments && student.assessments.length > 0 ? (
              <div className="space-y-4">
                {student.assessments.map((assessment, index) => (
                  <Card key={index} className="p-4">
                    <Typography variant="small" color="gray" className="mb-2">
                      التاريخ: {assessment.date}
                    </Typography>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {Object.entries(assessment.scores).map(([elementId, score]) => {
                        const element = assessmentElements.find(el => el.id === elementId);
                        return element ? (
                          <Typography key={elementId} variant="paragraph" color="blue-gray">
                            {element.name}: {score}
                          </Typography>
                        ) : null;
                      })}
                    </div>
                    {assessment.notes && (
                      <Typography variant="paragraph" color="blue-gray">
                        ملاحظات: {assessment.notes}
                      </Typography>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Typography>لا توجد تقييمات سابقة لهذا الطالب.</Typography>
            )}
            <Button className="mt-4" onClick={() => onAssess(student)}>
              إجراء تقييم جديد
            </Button>
          </div>
        )}
      </DialogBody>
      <DialogFooter>
        <Button variant="text" color="red" onClick={onClose}>
          إغلاق
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export default StudentDetailModal;
