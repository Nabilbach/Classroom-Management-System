import React, { useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import { ScheduledLesson } from '../services/api/scheduledLessonService';

interface LessonEditModalProps {
  lesson: ScheduledLesson | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedLesson: ScheduledLesson) => void;
}

const LessonEditModal: React.FC<LessonEditModalProps> = ({ lesson, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<ScheduledLesson>>({});

  useEffect(() => {
    if (lesson) {
      setFormData(lesson);
    } else {
      setFormData({});
    }
  }, [lesson]);

  if (!isOpen || !lesson) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const existingDateTime = DateTime.fromISO(formData.date || lesson.date);
    const newDate = DateTime.fromISO(e.target.value);
    const newDateTime = existingDateTime.set({ year: newDate.year, month: newDate.month, day: newDate.day });
    setFormData(prev => ({ ...prev, date: newDateTime.toISO() }));
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const existingDateTime = DateTime.fromISO(formData.date || lesson.date);
    const [hour, minute] = e.target.value.split(':').map(Number);
    const newDateTime = existingDateTime.set({ hour, minute });
    setFormData(prev => ({ ...prev, date: newDateTime.toISO() }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title) {
      onSave(formData as ScheduledLesson);
    }
  };

  const lessonDate = DateTime.fromISO(lesson.date);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-full overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Edit Lesson</h2>
            
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
              <input type="text" name="title" id="title" value={formData.title || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <select name="status" id="status" value={formData.status || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                  <option value="planned">Planned</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                <input type="date" name="date" id="date" value={lessonDate.toISODate()} onChange={handleDateChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Time</label>
                <input type="time" name="time" id="time" value={lessonDate.toFormat('HH:mm')} onChange={handleTimeChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="objectives" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Objectives</label>
              <textarea name="objectives" id="objectives" value={formData.objectives || ''} onChange={handleInputChange} rows={4} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"></textarea>
            </div>

            <div>
              <label htmlFor="lessonStages" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lesson Stages</label>
              <textarea name="lessonStages" id="lessonStages" value={formData.lessonStages || ''} onChange={handleInputChange} rows={6} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"></textarea>
            </div>

            <div className="mb-4">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
              <textarea name="notes" id="notes" value={formData.notes || ''} onChange={handleInputChange} rows={4} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"></textarea>
            </div>

          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">Save</button>
            <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-500 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LessonEditModal;
