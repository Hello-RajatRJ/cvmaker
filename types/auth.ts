import { RankTitle, TestResult } from './assessment';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'candidate' | 'recruiter' | 'admin';
  rankTitle: RankTitle;
  highestScore: number;
  testsTaken: number;
  unlockedTemplates: string[]; // List of template IDs unlocked via Razorpay
  hasTestPass: boolean; // Purchased mock test access
  testHistory: TestResult[];
  createdAt: string;
}

export interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
