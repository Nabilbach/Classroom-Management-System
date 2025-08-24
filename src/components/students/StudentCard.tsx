import React, { useState, useEffect } from 'react';
import { Typography, IconButton, Input } from "@material-tailwind/react";
import { FaEdit, FaTrash, FaInfoCircle, FaStar } from 'react-icons/fa';

// Final merged version of the Student Card

const StudentCard = ({ student, onEdit, onDelete, onDetail, onAssess, onUpdateNumber }) => {

  // --- State for Editable Number ---
  const [isEditingNumber, setIsEditingNumber] = useState(false);
  const [numberValue, setNumberValue] = useState(student.studentNumberInSection || 0);

  useEffect(() => {
    setNumberValue(student.studentNumberInSection || 0);
  }, [student.studentNumberInSection]);

  // --- Placeholder Data for Dashboard UI ---
  const average = 85;
  const attendance = 98;
  const warnings = 1;
  const goal = "اجتياز جميع الاختبارات بنجاح";
  // -------------------------------------

  const getBadgeStyle = (badge) => {
    switch (badge) {
      case 'Excellent': case 'ممتاز': return 'bg-green-100 text-green-800 border-green-300';
      case 'Good': case 'جيد': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Needs Improvement': case 'يحتاج لتحسين': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getAverageColor = (avg) => {
    if (avg > 79) return 'bg-green-500';
    if (avg >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleNumberUpdate = () => {
    setIsEditingNumber(false);
    const newNumber = parseInt(String(numberValue), 10);
    if (!isNaN(newNumber) && newNumber !== student.studentNumberInSection) {
      onUpdateNumber(student.id, newNumber);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleNumberUpdate();
    else if (e.key === 'Escape') {
      setIsEditingNumber(false);
      setNumberValue(student.studentNumberInSection || 0);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200 text-right flex flex-col h-full" dir="rtl">
      
      {/* Header: Badge and Editable Number */}
      <div className="flex justify-between items-start mb-2">
        <div className={`px-2 py-1 rounded-full text-xs font-semibold border ${getBadgeStyle(student.badge)}`}>
          {student.badge}
        </div>
        <div 
          className="bg-gray-100 border border-gray-300 rounded-full px-3 py-1 flex items-center gap-2 cursor-pointer"
          onClick={() => !isEditingNumber && setIsEditingNumber(true)}
        >
          {isEditingNumber ? (
            <Input 
              type="number" 
              value={numberValue} 
              onChange={(e) => setNumberValue(Number(e.target.value))} 
              onBlur={handleNumberUpdate} 
              onKeyDown={handleKeyDown} 
              autoFocus 
              className="!w-12 text-center p-0 bg-transparent border-none focus:ring-0"
              labelProps={{ className: "hidden" }}
              containerProps={{ className: "min-w-0" }}
            />
          ) : (
            <>
              <Typography variant="small" color="blue-gray" className="font-semibold">
                {student.studentNumberInSection}
              </Typography>
              <Typography variant="small" color="blue-gray" className="font-bold">
                ر.ت
              </Typography>
            </>
          )}
        </div>
      </div>

      {/* Student Name */}
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">{student.firstName} {student.lastName}</h3>
      </div>

      {/* Average Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className={`h-2.5 rounded-full ${getAverageColor(average)}`} style={{ width: `${average}%` }}></div>
        </div>
      </div>

      {/* Mini Stats Grid */}
      <div className="grid grid-cols-3 gap-2 text-center mb-4">
        <div>
          <span className="text-lg font-bold">📊</span>
          <p className="text-sm font-semibold text-gray-700">{average}%</p>
          <p className="text-xs text-gray-500">المعدل</p>
        </div>
        <div>
          <span className="text-lg font-bold">✅</span>
          <p className="text-sm font-semibold text-gray-700">{attendance}%</p>
          <p className="text-xs text-gray-500">الحضور</p>
        </div>
        <div>
          <span className="text-lg font-bold">⚠️</span>
          <p className="text-sm font-semibold text-gray-700">{warnings}</p>
          <p className="text-xs text-gray-500">إنذارات</p>
        </div>
      </div>

      

      {/* Footer: Action Buttons */}
      <div className="mt-auto pt-4 border-t border-gray-200 flex justify-around items-center">
        <div className="flex flex-col items-center">
          <IconButton variant="text" onClick={() => onAssess(student)} className="hover:bg-yellow-100">
            <FaStar className="text-yellow-600" />
          </IconButton>
          <Typography variant="small" className="text-xs text-gray-600 font-semibold">تقييم</Typography>
        </div>
        <div className="flex flex-col items-center">
          <IconButton variant="text" onClick={() => onEdit(student)} className="hover:bg-blue-100">
            <FaEdit className="text-blue-500" />
          </IconButton>
          <Typography variant="small" className="text-xs text-gray-600 font-semibold">تعديل</Typography>
        </div>
        <div className="flex flex-col items-center">
          <IconButton variant="text" onClick={() => onDetail(student)} className="hover:bg-gray-200">
            <FaInfoCircle className="text-gray-500" />
          </IconButton>
          <Typography variant="small" className="text-xs text-gray-600 font-semibold">تفاصيل</Typography>
        </div>
        <div className="flex flex-col items-center">
          <IconButton variant="text" onClick={() => onDelete(student.id)} className="hover:bg-red-100">
            <FaTrash className="text-red-500" />
          </IconButton>
          <Typography variant="small" className="text-xs text-gray-600 font-semibold">حذف</Typography>
        </div>
      </div>
    </div>
  );
};

export default StudentCard;
