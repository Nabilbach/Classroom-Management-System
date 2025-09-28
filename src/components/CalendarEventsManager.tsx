import React, { useMemo, useCallback } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { format, parseISO, isSameDay, isWithinInterval, isAfter, isBefore, endOfWeek } from 'date-fns';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  isAllDay?: boolean;
  type: 'holiday' | 'meeting' | 'exam' | 'event';
  description?: string;
  color?: string;
}

interface Props {
  calendarEvents: CalendarEvent[];
  currentWeekStart: Date;
  onEventClick: (event: CalendarEvent) => void;
}

const DAYS = ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const CalendarEventsManager: React.FC<Props> = ({ calendarEvents, currentWeekStart, onEventClick }) => {
  // Helper function to check if a date is within an event's range
  const isDateInEventRange = useCallback((targetDate: Date, event: CalendarEvent): boolean => {
    const eventStartDate = parseISO(event.date);
    if (!event.endDate) {
      return isSameDay(eventStartDate, targetDate);
    }
    const eventEndDate = parseISO(event.endDate);
    return (
      (isSameDay(eventStartDate, targetDate) || isAfter(targetDate, eventStartDate)) &&
      (isSameDay(eventEndDate, targetDate) || isBefore(targetDate, eventEndDate))
    );
  }, []);

  // Get dates for each day of the current week
  const getWeekDates = useMemo(() => {
    const weekDays = Array.from({ length: DAYS.length }, (_, i) => {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
    return DAYS.map((day, index) => ({
      dayName: day,
      date: weekDays[index],
      formattedDate: format(weekDays[index], 'dd MMMM')
    }));
  }, [currentWeekStart]);

  // Get events for a specific date object
  const getEventsForDate = useCallback((date: Date) => {
    return calendarEvents.filter(event => isDateInEventRange(date, event));
  }, [calendarEvents, isDateInEventRange]);

  return (
    <>
      {getWeekDates.map(({ dayName, formattedDate, date }) => {
        const dayEvents = getEventsForDate(date);
        return (
          <div key={dayName} className="p-2 font-bold text-center border-b border-gray-300 space-y-1" style={{ fontWeight: 'bold' }}>
            <div className="text-base" style={{ fontWeight: 'bold' }}>{dayName}</div>
            <div className="text-xs text-gray-600">{formattedDate}</div>
            {/* Display Events */}
            {dayEvents.map((event) => {
              const isMultiDay = event.endDate && event.endDate !== event.date;
              const isStartDay = event.date === format(date, 'yyyy-MM-dd');
              const isEndDay = event.endDate === format(date, 'yyyy-MM-dd');
              return (
                <div
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className={`text-xs px-2 py-1 rounded cursor-pointer hover:opacity-80 text-white font-medium relative ${isMultiDay ? 'border-l-4 border-r-4' : ''}`}
                  style={{ backgroundColor: event.color || '#1976d2', borderColor: isMultiDay ? 'rgba(255,255,255,0.8)' : 'transparent' }}
                >
                  {event.title}
                  {isMultiDay && (
                    <div className="text-xs opacity-75 mt-1">
                      {isStartDay && isEndDay ? '📅 يوم واحد' : isStartDay ? '🏁 بداية' : isEndDay ? '🏁 نهاية' : '➖ متواصل'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </>
  );
};

export default CalendarEventsManager;
