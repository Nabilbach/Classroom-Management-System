import { useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import { useSections } from '../contexts/SectionsContext';
import { fetchAdminSchedule } from '../services/api/adminScheduleService';
import { getSessionEndTime } from '../utils/lessonUtils';

interface WeeklyScheduleSession {
  id: string;
  day: string;
  startTime: string;
  duration: number;
  sectionId: string;
  sectionName: string;
  classroom: string;
}

export interface CurrentSessionInfo extends WeeklyScheduleSession {
  endTime: string;
}

const DAY_MAP: { [key: number]: string } = {
  1: 'الإثنين',
  2: 'الثلاثاء',
  3: 'الأربعاء',
  4: 'الخميس',
  5: 'الجمعة',
  6: 'السبت',
  7: 'الأحد',
};

export const useCurrentSession = () => {
  const [currentSession, setCurrentSession] = useState<CurrentSessionInfo | null>(null);
  const [nextSession, setNextSession] = useState<WeeklyScheduleSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { sections } = useSections();

  useEffect(() => {
    const checkSessions = async () => {
      try {
        const schedule = await fetchAdminSchedule();
        if (!Array.isArray(schedule)) {
          console.error("Fetched schedule is not an array:", schedule);
          setCurrentSession(null);
          setNextSession(null);
          return;
        }

        const now = DateTime.local().setZone('Africa/Casablanca');
        const currentDayName = DAY_MAP[now.weekday];
        const currentTime = now.toFormat('HH:mm');

        let activeSession: CurrentSessionInfo | null = null;
        let upcomingSession: WeeklyScheduleSession | null = null;

        const todaysSessions = schedule
          .filter(session => session.day === currentDayName)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));

        for (const session of todaysSessions) {
          const sessionStart = session.startTime;
          const sessionEnd = getSessionEndTime(session.startTime, session.duration);
          const section = sections.find(s => s.id === session.sectionId);
          const sessionWithSectionName = {
            ...session,
            sectionName: section ? section.name : 'Unknown Section',
          };

          if (currentTime >= sessionStart && currentTime < sessionEnd) {
            activeSession = { ...sessionWithSectionName, endTime: sessionEnd };
            break; // Found active session, no need to look for the next one in this loop
          }

          if (sessionStart > currentTime) {
            if (!upcomingSession) {
              upcomingSession = sessionWithSectionName;
            }
          }
        }

        setCurrentSession(activeSession);
        setNextSession(activeSession ? null : upcomingSession);

      } catch (error) {
        console.error("Failed to fetch schedule for session check:", error);
        setCurrentSession(null);
        setNextSession(null);
      } finally {
        if (isLoading) setIsLoading(false);
      }
    };

    checkSessions();
    const intervalId = setInterval(checkSessions, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [sections]);

  return { currentSession, nextSession, isLoading };
};
