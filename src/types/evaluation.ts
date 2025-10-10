export interface EvaluationData {
  id?: number;
  student_id: number;
  behavior: number;
  participation: number;
  homework: number;
  attendance: number;
  collaboration: number;
  creativity: number;
  leadership: number;
  critical_thinking: number;
  problem_solving: number;
  communication: number;
  date: string;
  comments?: string;
  total_xp: number;
  student_level: number;
  xp_gained?: number;
}

export interface FollowupData {
  id?: number;
  student_id: number;
  type: 'behavioral' | 'academic' | 'administrative';
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  created_at?: string;
  updated_at?: string;
}

export interface AssessmentHistoryItem {
  id: number;
  date: string;
  total_xp: number;
  student_level: number;
  xp_gained: number;
  comments?: string;
}

export interface Student {
  id: number;
  name: string;
  section_id: number;
  section?: {
    name: string;
  };
}

// Level system constants
export const LEVEL_NAMES: Record<number, string> = {
  1: 'مبتدئ',
  2: 'متطور',
  3: 'ماهر', 
  4: 'خبير',
  5: 'متقن',
  6: 'محترف',
  7: 'استثنائي'
};

export const LEVEL_COLORS: Record<number, string> = {
  1: 'text-gray-600',
  2: 'text-green-600',
  3: 'text-blue-600',
  4: 'text-purple-600',
  5: 'text-orange-600',
  6: 'text-red-600',
  7: 'text-yellow-600'
};

// XP thresholds for each level
export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 850, 1300, 2000, 3000];

export const calculateLevel = (xp: number): number => {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      return i;
    }
  }
  return 1;
};