import React, { useState } from 'react';
import { Dialog, DialogHeader, DialogBody, DialogFooter, Typography, Button, Input } from "@material-tailwind/react";
import * as XLSX from 'xlsx';
import { useStudents } from '../../contexts/StudentsContext';
import { useSections } from '../../contexts/SectionsContext';

interface ExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function ExcelUploadModal({ isOpen, onClose }: ExcelUploadModalProps) {
  const { fetchStudents } = useStudents();
  const { currentSection } = useSections();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validExtensions = ['.xlsx', '.xls'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

      if (validExtensions.includes(fileExtension)) {
        setFile(file);
        setError('');
        setSuccessMessage('');
      } else {
        setFile(null);
        setError('الرجاء اختيار ملف Excel صالح (xlsx أو xls).');
      }
    } else {
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('الرجاء اختيار ملف Excel.');
      return;
    }
    if (!currentSection) {
      setError('الرجاء اختيار قسم أولاً.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (json.length < 2) {
          setError('الملف فارغ أو لا يحتوي على بيانات طلاب.');
          return;
        }

        const dataRows = json.slice(1);

        const newStudents = dataRows.map((row: any) => {
          if (!row || row.length === 0) return null;

          const class_order = parseInt(String(row[0]).trim(), 10);
          const pathway_number = row[1] ? String(row[1]).trim() : '';
          const last_name = row[2] ? String(row[2]).trim() : '';
          const first_name = row[3] ? String(row[3]).trim() : '';

          if (first_name && last_name) {
            return {
              first_name,
              last_name,
              pathway_number,
              sectionId: currentSection.id,
              gender: (row[4] ? String(row[4]) : 'غير محدد').trim(),
              birth_date: (row[5] ? String(row[5]) : '').trim(),
              class_order: !isNaN(class_order) ? class_order : 0,
            };
          }
          return null;
        }).filter((s) => s !== null);

        const response = await fetch('http://localhost:3000/api/students/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newStudents),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to add students in bulk');
        }

        await fetchStudents();
        setSuccessMessage(`تمت إضافة ${newStudents.length} طالب بنجاح.`);
        setFile(null);
        onClose();
      } catch (err: any) {
        setError(err.message || 'حدث خطأ أثناء معالجة الملف. الرجاء التأكد من أنه ملف Excel صالح.');
        console.error(err);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <Dialog open={isOpen} handler={onClose} size="sm">
      <DialogHeader>رفع ملف Excel بأسماء الطلاب</DialogHeader>
      <DialogBody divider>
        <div className="flex flex-col gap-4">
          <Input
            type="file"
            label="اختر ملف Excel"
            onChange={handleFileChange}
            accept=".xlsx, .xls"
            crossOrigin="anonymous"
          />
          {error && <Typography color="red">{error}</Typography>}
          {successMessage && <Typography color="green">{successMessage}</Typography>}
        </div>
      </DialogBody>
      <DialogFooter>
        <Button variant="text" color="red" onClick={onClose} className="mr-1">
          إلغاء
        </Button>
        <Button variant="gradient" color="green" onClick={handleUpload}>
          رفع وإضافة الطلاب
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export default ExcelUploadModal;