import { useState } from 'react';
import { Card, Typography, Button, Dialog, DialogHeader, DialogBody, DialogFooter, Input, Select, Option, IconButton } from "@material-tailwind/react";
import { FaPlus, FaTrash } from 'react-icons/fa';
import { useSettings } from '../contexts/SettingsContext';

// This is the page component for Assessment Settings.
function AssessmentSettingsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { assessmentElements, addAssessmentElement, deleteAssessmentElement } = useSettings();

  // State for the new element form inside the modal
  const [newElementName, setNewElementName] = useState('');
  const [newElementType, setNewElementType] = useState('numeric');
  const [newElementMaxValue, setNewElementMaxValue] = useState(10);

  const handleAddElement = () => {
    if (!newElementName) return;
    const newElement = {
      id: Date.now().toString(),
      name: newElementName,
      type: newElementType as 'numeric' | 'quick_icon' | 'grade' | 'scale', // Explicitly cast to the union type
      maxValue: newElementType === 'numeric' ? newElementMaxValue : undefined,
      icons: newElementType === 'quick_icon' ? ['👍', '🔶', '⚠️', '👎'] : undefined,
    };
    addAssessmentElement(newElement);
    setNewElementName(''); // Reset form
  };

  return (
    <div className="p-4 md:p-8">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <Typography variant="h4" color="blue-gray">
            إعدادات التقييم
          </Typography>
          <Button onClick={() => setIsModalOpen(true)} color="blue">
            تعديل عناصر التقييم
          </Button>
        </div>
        <Typography variant="paragraph" color="blue-gray">
          هنا يمكنك عرض إعدادات التقييم الحالية. اضغط على الزر لتعديل العناصر.
        </Typography>
        
        {/* Displaying current elements on the page for context */}
        <div className="mt-6 space-y-2">
          <Typography variant="h6">العناصر الحالية:</Typography>
          {assessmentElements.map(el => (
            <div key={el.id} className="flex justify-between items-center p-2 border rounded-lg">
              <Typography>{el.name} (النوع: {el.type})</Typography>
            </div>
          ))}
        </div>
      </Card>

      {/* The Modal for Editing Settings */}
      <Dialog open={isModalOpen} handler={() => setIsModalOpen(false)} size="md">
        <DialogHeader>تعديل عناصر التقييم</DialogHeader>
        <DialogBody divider className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Typography variant="h6">العناصر الحالية</Typography>
            {assessmentElements.map(el => (
              <div key={el.id} className="flex justify-between items-center p-2 border rounded-lg">
                <Typography>{el.name} (النوع: {el.type})</Typography>
                <IconButton variant="text" color="red" onClick={() => deleteAssessmentElement(el.id)}>
                  <FaTrash />
                </IconButton>
              </div>
            ))}
          </div>

          <div>
            <Typography variant="h6" className="mb-2">إضافة عنصر جديد</Typography>
            <div className="flex flex-col gap-4">
              <Input
                label="اسم العنصر"
                value={newElementName}
                onChange={(e) => setNewElementName(e.target.value)}
                crossOrigin={undefined}
              />
              <Select label="نوع العنصر" value={newElementType} onChange={(val) => setNewElementType(val || '')}>
                <Option value="numeric">رقمي</Option>
                <Option value="quick_icon">أيقونة سريعة</Option>
              </Select>

              {newElementType === 'numeric' && (
                <Input
                  label="القيمة القصوى"
                  type="number"
                  value={newElementMaxValue}
                  onChange={(e) => setNewElementMaxValue(Number(e.target.value))}
                  crossOrigin={undefined}
                />
              )}
              
              <Button onClick={handleAddElement} fullWidth>
                <FaPlus className="inline ml-2" />
                إضافة عنصر
              </Button>
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="gradient" onClick={() => setIsModalOpen(false)}>
            إغلاق
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

export default AssessmentSettingsPage;
