import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Dashboard from './Dashboard';

// Mock data
const mockLessons = [{ id: 1, title: 'Math', date: '2025-03-17', status: 'completed' }];
const mockStudents = [{ id: 1, name: 'Ahmed', notes: 'متابعة' }];
const mockAssessments = [{ id: 1, student_id: 1, score: 85, date: '2025-03-17' }];
const mockAttendance = [{ id: 1, student_id: 1, date: '2025-03-17', status: 'present' }];

describe('Dashboard', () => {
  const mockDate = new Date(2025, 2, 17, 10, 30, 0);

  beforeEach(() => {
    vi.spyOn(global, 'Date').mockImplementation(() => mockDate);

    global.fetch = vi.fn((url) =>
      Promise.resolve({
        json: () => {
          if (url.includes('lessons.json')) return Promise.resolve(mockLessons);
          if (url.includes('students.json')) return Promise.resolve(mockStudents);
          if (url.includes('assessments.json')) return Promise.resolve(mockAssessments);
          if (url.includes('attendance.json')) return Promise.resolve(mockAttendance);
          if (url.includes('events.json')) return Promise.resolve([]);
          return Promise.resolve([]);
        },
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Clock & Date', () => {
    it('should render the analog clock', () => {
        render(<Dashboard />);
        const clockElement = screen.getByRole('figure', { name: /analog clock/i });
        expect(clockElement).toBeInTheDocument();
    });

    it('should display the correct Gregorian date', async () => {
        render(<Dashboard />);
        await waitFor(() => {
            const gregorianDateElement = screen.getByText(/lundi 17 mars 2025/i);
            expect(gregorianDateElement).toBeInTheDocument();
        });
    });

    it('should display the correct Hijri date', async () => {
        render(<Dashboard />);
        // The exact Hijri date for March 17, 2025 is 17 Ramadan 1446
        await waitFor(() => {
            const hijriDateElement = screen.getByText(/١٧ رمضان ١٤٤٦ هـ/i);
            expect(hijriDateElement).toBeInTheDocument();
        });
    });
  });

  describe("Today's Tasks", () => {
    it('should render tasks from all sources', async () => {
        const todaysLessons = [{ id: 1, title: 'Physics', date: '2025-03-17', status: 'planned' }];
        const studentsWithNotes = [{ id: 2, name: 'Fatima', notes: 'تحتاج دعماً' }];
        const todaysEvents = [{ id: 2, section_id: 'TCS-1', date: '2025-03-17' }];

        global.fetch = vi.fn((url) =>
            Promise.resolve({
                json: () => {
                    if (url.includes('lessons.json')) return Promise.resolve(todaysLessons);
                    if (url.includes('students.json')) return Promise.resolve(studentsWithNotes);
                    if (url.includes('attendance.json')) return Promise.resolve(todaysEvents);
                    if (url.includes('events.json')) return Promise.resolve([]);
                    return Promise.resolve([]);
                },
            })
        );

        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText(/التحضير للدرس: Physics/i)).toBeInTheDocument();
            expect(screen.getByText(/متابعة الطالب: Fatima/i)).toBeInTheDocument();
            expect(screen.getByText(/حدث اليوم: TCS-1/i)).toBeInTheDocument();
        });
    });

    it('should not display duplicate tasks', async () => {
        const todaysLessons = [{ id: 1, title: 'Physics', date: '2025-03-17', status: 'planned' }];
        global.fetch = vi.fn((url) =>
            Promise.resolve({
                json: () => {
                    if (url.includes('lessons.json')) return Promise.resolve(todaysLessons);
                    return Promise.resolve([]);
                },
            })
        );

        render(<Dashboard />);

        await waitFor(() => {
            const tasks = screen.getAllByText(/التحضير للدرس: Physics/i);
            expect(tasks.length).toBe(1);
        });
    });

    it('should display a message when there are no tasks', async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve([]),
            })
        );

        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText(/لا توجد مهام معلقة اليوم/i)).toBeInTheDocument();
        });
    });
  });

  describe('Leaderboard', () => {
    it('should show loading state initially', () => {
        global.fetch = vi.fn(() => new Promise(() => {})); // Never resolves
        render(<Dashboard />);
        const leaderboardCard = screen.getByText("أفضل الطلاب هذا الأسبوع").closest('div.p-6');
        expect(within(leaderboardCard).getByText(/جاري التحميل.../i)).toBeInTheDocument();
    });

    it('should display exactly 3 students sorted by score', async () => {
        const students = [
            { id: 1, name: 'Sara' },
            { id: 2, name: 'Omar' },
            { id: 3, name: 'Layla' },
            { id: 4, name: 'Hassan' },
        ];
        const assessments = [
            { id: 1, student_id: 1, score: 95, date: '2025-03-17' },
            { id: 2, student_id: 2, score: 90, date: '2025-03-17' },
            { id: 3, student_id: 3, score: 88, date: '2025-03-17' },
            { id: 4, student_id: 4, score: 80, date: '2025-03-17' },
        ];
        const attendance = [
            { id: 1, student_id: 1, date: '2025-03-17', status: 'present' },
            { id: 2, student_id: 2, date: '2025-03-17', status: 'present' },
            { id: 3, student_id: 3, date: '2025-03-17', status: 'present' },
            { id: 4, student_id: 4, date: '2025-03-17', status: 'absent' },
        ];

        global.fetch = vi.fn((url) =>
            Promise.resolve({
                json: () => {
                    if (url.includes('students.json')) return Promise.resolve(students);
                    if (url.includes('assessments.json')) return Promise.resolve(assessments);
                    if (url.includes('attendance.json')) return Promise.resolve(attendance);
                    if (url.includes('events.json')) return Promise.resolve([]);
                    return Promise.resolve([]);
                },
            })
        );

        render(<Dashboard />);

        await waitFor(() => {
            const leaderboardCard = screen.getByText("أفضل الطلاب هذا الأسبوع").closest('div.p-6');
            const studentList = within(leaderboardCard).getAllByRole('button');
            expect(studentList.length).toBe(3);
            expect(studentList[0].textContent).toContain('Sara');
            expect(studentList[1].textContent).toContain('Omar');
            expect(studentList[2].textContent).toContain('Layla');
        });
    });

    it('should assign medals correctly', async () => {
        const students = [
            { id: 1, name: 'Sara' },
            { id: 2, name: 'Omar' },
            { id: 3, name: 'Layla' },
        ];
        const assessments = [
            { id: 1, student_id: 1, score: 95, date: '2025-03-17' },
            { id: 2, student_id: 2, score: 90, date: '2025-03-17' },
            { id: 3, student_id: 3, score: 88, date: '2025-03-17' },
        ];
        const attendance = [
            { id: 1, student_id: 1, date: '2025-03-17', status: 'present' },
            { id: 2, student_id: 2, date: '2025-03-17', status: 'present' },
            { id: 3, student_id: 3, date: '2025-03-17', status: 'present' },
        ];

        global.fetch = vi.fn((url) =>
            Promise.resolve({
                json: () => {
                    if (url.includes('students.json')) return Promise.resolve(students);
                    if (url.includes('assessments.json')) return Promise.resolve(assessments);
                    if (url.includes('attendance.json')) return Promise.resolve(attendance);
                    if (url.includes('events.json')) return Promise.resolve([]);
                    return Promise.resolve([]);
                },
            })
        );

        render(<Dashboard />);

        await waitFor(() => {
            const leaderboardCard = screen.getByText("أفضل الطلاب هذا الأسبوع").closest('div.p-6');
            expect(within(leaderboardCard).getByText(/🥇/)).toBeInTheDocument();
            expect(within(leaderboardCard).getByText(/🥈/)).toBeInTheDocument();
            expect(within(leaderboardCard).getByText(/🥉/)).toBeInTheDocument();
        });
    });
  });

  describe('Upcoming Events', () => {
    it('should render upcoming events and their details', async () => {
        const mockEvents = [
            {
                id: '1',
                title: 'امتحان فصلي',
                start: new Date(2025, 2, 20).toISOString(),
                end: new Date(2025, 2, 20).toISOString(),
                allDay: true,
                section_id: '1 باك',
                urgent: true,
            },
        ];
        global.fetch = vi.fn((url) =>
            Promise.resolve({
                json: () => {
                    if (url.includes('events.json')) return Promise.resolve(mockEvents);
                    return Promise.resolve([]);
                },
            })
        );

        render(<Dashboard />);
        await waitFor(() => {
            expect(screen.getByText(/امتحان فصلي - 1 باك/i)).toBeInTheDocument();
            expect(screen.getByText(/بعد 3 أيام/i)).toBeInTheDocument();
        });
    });

    it('should highlight urgent events', async () => {
        const mockEvents = [
            {
                id: '1',
                title: 'امتحان فصلي',
                start: new Date(2025, 2, 20).toISOString(),
                end: new Date(2025, 2, 20).toISOString(),
                allDay: true,
                section_id: '1 باك',
                urgent: true,
            },
        ];
        global.fetch = vi.fn((url) =>
            Promise.resolve({
                json: () => {
                    if (url.includes('events.json')) return Promise.resolve(mockEvents);
                    return Promise.resolve([]);
                },
            })
        );
        render(<Dashboard />);
        await waitFor(() => {
            const urgentEvent = screen.getByText(/امتحان فصلي - 1 باك/i).closest('div[role="button"]');
            expect(urgentEvent).toHaveClass('text-red-500');
        });
    });

    it('should not show events beyond 7 days', async () => {
        const mockEvents = [
            {
                id: '1',
                title: 'اجتماع أولياء الأمور',
                start: new Date(2025, 2, 25).toISOString(),
                end: new Date(2025, 2, 25).toISOString(),
                allDay: true,
                section_id: '2 باك',
            },
        ];
        global.fetch = vi.fn((url) =>
            Promise.resolve({
                json: () => {
                    if (url.includes('events.json')) return Promise.resolve(mockEvents);
                    return Promise.resolve([]);
                },
            })
        );
        render(<Dashboard />);
        await waitFor(() => {
            const oldEvent = screen.queryByText(/اجتماع أولياء الأمور/i);
            expect(oldEvent).not.toBeInTheDocument();
        });
    });

    it('should display a message when there are no upcoming events', async () => {
        global.fetch = vi.fn((url) =>
            Promise.resolve({
                json: () => {
                    if (url.includes('events.json')) return Promise.resolve([]);
                    return Promise.resolve([]);
                },
            })
        );
        render(<Dashboard />);
        await waitFor(() => {
            expect(screen.getByText(/لا توجد أحداث قادمة/i)).toBeInTheDocument();
        });
    });
  });
});