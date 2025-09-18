
// This is a mock API service. In a real application, this would make a network request.

export interface LessonTemplate {
  id: number;
  title: string;
  subject: string;
  level: string; // e.g., '1st Year Bac', '2nd Year Bac'
  week: number;
  details: string;
}

const mockTemplates: LessonTemplate[] = [
  { id: 1, title: 'Surat Yasin: Verses 1-12', subject: 'Islamic Education', level: '1st Year Bac', week: 1, details: 'Understanding the message of revelation.' },
  { id: 2, title: 'Faith and the Unseen', subject: 'Islamic Education', level: '1st Year Bac', week: 1, details: 'Exploring the pillars of Iman.' },
  { id: 3, title: 'The Prophet's Biography (Sirah)', subject: 'Islamic Education', level: '1st Year Bac', week: 2, details: 'Lessons from the Meccan period.' },
  { id: 4, title: 'Limits and Continuity', subject: 'Mathematics', level: '2nd Year Bac', week: 3, details: 'Introduction to calculus concepts.' },
  { id: 5, title: 'Atomic Structure', subject: 'Physics', level: '2nd Year Bac', week: 3, details: 'Models of the atom.' },
  { id: 6, title: 'Surat Al-Kahf: The People of the Cave', subject: 'Islamic Education', level: '2nd Year Bac', week: 4, details: 'Lessons in faith and perseverance.' },
  { id: 7, title: 'The Philosophy of Existence', subject: 'Philosophy', level: '2nd Year Bac', week: 4, details: 'Exploring existential questions.' },
  { id: 8, title: 'Core Beliefs (Aqidah)', subject: 'Islamic Education', level: 'Common Core', week: 1, details: 'Fundamentals of Islamic creed.' },
  { id: 9, title: 'Introduction to Fiqh', subject: 'Islamic Education', level: 'Common Core', week: 2, details: 'Principles of Islamic jurisprudence.' },
];

export const fetchLessonTemplates = (): Promise<LessonTemplate[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(mockTemplates);
    }, 1000); // Simulate network delay
  });
};
