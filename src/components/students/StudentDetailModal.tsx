import { useState } from 'react';
import { Dialog, DialogHeader, DialogBody, DialogFooter, Typography, Button, Tabs, TabsHeader, Tab, Card } from "@material-tailwind/react";
import { useSections } from '../../contexts/SectionsContext';
import { useSettings } from '../../contexts/SettingsContext';
import type { Student as UnifiedStudent } from '../../types/student';
import { MdContentCopy } from 'react-icons/md';

interface AssessmentRecord {
  date: string;
  scores: { [elementId: string]: string };
  notes: string;
}

// Use unified student type and extend with optional assessments for this modal
interface Student extends UnifiedStudent {
  assessments?: AssessmentRecord[];
}

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onAssess: (student: Student) => void;
}

function StudentDetailModal({ isOpen, onClose, student, onAssess }: StudentDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'assessments' | 'behavior'>('overview');
  const { sections } = useSections();
  const { assessmentElements } = useSettings();
  const [copied, setCopied] = useState<string | null>(null);

  if (!student) return null;

  // Ensure matching even if sectionId types differ (string vs number)
  const section = sections.find(s => String(s.id) === String(student.sectionId));

  const fullName = `${student.firstName} ${student.lastName}`.trim();
  const pathway = student.pathwayNumber || student.trackNumber || '';

  const handleCopy = async (key: string, value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch (e) {
      console.error('Clipboard copy failed:', e);
      alert('تعذر النسخ إلى الحافظة.');
    }
  };

  return (
    <Dialog open={isOpen} handler={onClose} size="md" dir="rtl">
      <DialogHeader className="w-full text-right">تفاصيل الطالب: {student.firstName} {student.lastName}</DialogHeader>
      <DialogBody divider dir="rtl" className="text-right">
        <Tabs value={activeTab}>
          <TabsHeader className="justify-end">
            <Tab value="overview" onClick={() => setActiveTab('overview')}>نظرة عامة</Tab>
            <Tab value="assessments" onClick={() => setActiveTab('assessments')}>التقييمات</Tab>
            <Tab value="behavior" onClick={() => setActiveTab('behavior')}>سجل السلوك</Tab>
          </TabsHeader>
        </Tabs>

        {activeTab === 'overview' && (
          <div className="p-4">
            <Typography variant="h6" color="blue-gray" className="mb-3">معلومات الطالب</Typography>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <th className="border p-2 bg-gray-100 w-1/3 text-right">الاسم الكامل</th>
                    <td className="border p-2">
                      <div className="flex items-center justify-between gap-2">
                        <span>{fullName || '—'}</span>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                          onClick={() => handleCopy('name', fullName)}
                          title="نسخ الاسم"
                        >
                          <MdContentCopy />
                          <span className="text-sm">نسخ</span>
                        </button>
                      </div>
                      {copied === 'name' && (
                        <span className="text-green-600 text-xs">تم النسخ</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th className="border p-2 bg-gray-100 text-right">رمز مسار</th>
                    <td className="border p-2">
                      <div className="flex items-center justify-between gap-2">
                        <span>{pathway || '—'}</span>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                          onClick={() => handleCopy('pathway', pathway)}
                          title="نسخ رمز مسار"
                        >
                          <MdContentCopy />
                          <span className="text-sm">نسخ</span>
                        </button>
                      </div>
                      {copied === 'pathway' && (
                        <span className="text-green-600 text-xs">تم النسخ</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th className="border p-2 bg-gray-100 text-right">القسم</th>
                    <td className="border p-2">{section ? section.name : 'غير محدد'}</td>
                  </tr>
                  <tr>
                    <th className="border p-2 bg-gray-100 text-right">النوع</th>
                    <td className="border p-2">{student.gender || '—'}</td>
                  </tr>
                  <tr>
                    <th className="border p-2 bg-gray-100 text-right">تاريخ الازدياد</th>
                    <td className="border p-2">{student.birthDate || student.dateOfBirth || '—'}</td>
                  </tr>
                  <tr>
                    <th className="border p-2 bg-gray-100 text-right">رقم الترتيب (ر.ت)</th>
                    <td className="border p-2">{typeof student.classOrder === 'number' ? student.classOrder : '—'}</td>
                  </tr>
                  {typeof student.score !== 'undefined' && (
                    <tr>
                      <th className="border p-2 bg-gray-100 text-right">النقطة الحالية</th>
                      <td className="border p-2">{student.score}</td>
                    </tr>
                  )}
                  {typeof student.absences !== 'undefined' && (
                    <tr>
                      <th className="border p-2 bg-gray-100 text-right">عدد الغيابات</th>
                      <td className="border p-2">{student.absences}</td>
                    </tr>
                  )}
                  {student.badge && (
                    <tr>
                      <th className="border p-2 bg-gray-100 text-right">الشارة</th>
                      <td className="border p-2">{student.badge}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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

        {activeTab === 'behavior' && (
          <div className="p-4">
            <Typography variant="h6" color="blue-gray" className="mb-2">سجل السلوك</Typography>
            <Typography color="gray">سيظهر هنا لاحقًا أي إنذارات، تنويهات، أو ملاحظات خاصة بالتلميذ. (Placeholder)</Typography>
          </div>
        )}
      </DialogBody>
      <DialogFooter className="justify-start">
        <Button variant="text" color="red" onClick={onClose}>
          إغلاق
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export default StudentDetailModal;
