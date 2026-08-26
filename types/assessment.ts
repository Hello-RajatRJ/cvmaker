export type RankTitle = '🏆 Lead Architect' | '⚡ Senior Engineer' | '💡 Mid-Level Developer' | '🌱 Associate Engineer';

export type QuestionDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface Question {
  id: string;
  techId: string;
  techName: string;
  topic: string;
  difficulty: QuestionDifficulty;
  type: 'mcq' | 'code_output';
  questionText: string;
  codeSnippet?: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface TechnologyPack {
  id: string;
  name: string;
  icon: string;
  category: 'frontend' | 'backend' | 'database' | 'cloud' | 'core' | 'ai_devops';
  questionCount: number;
  description: string;
  durationMinutes?: number;
  passingScore?: number;
  difficulty?: QuestionDifficulty;
  rules?: string[];
}

export interface UserAnswer {
  questionId: string;
  selectedOption: string | null;
  markedForReview: boolean;
  timeSpentSeconds: number;
}

export type ProctorViolationType =
  | 'LOOKING_AWAY'
  | 'FACE_NOT_DETECTED'
  | 'MULTIPLE_FACES'
  | 'PHONE_DETECTED'
  | 'COMPOUND_PHONE_GAZE'
  | 'TAB_SWITCH'
  | 'FULLSCREEN_EXIT'
  | 'SUSPICIOUS_POSTURE';

export interface ProctorViolationEvent {
  id: string;
  timestamp: string;
  type: ProctorViolationType;
  message: string;
  severity: 'warning' | 'critical';
}

export interface ProctoringReport {
  totalViolations: number;
  warningCount: number;
  criticalCount: number;
  lookingAwaySeconds: number;
  tabSwitches: number;
  fullscreenExits: number;
  isTerminated: boolean;
  terminationReason?: string;
  terminatedAt?: string;
  events: ProctorViolationEvent[];
}

export interface TestSession {
  sessionId: string;
  techId: string;
  techName: string;
  questions: Question[];
  userAnswers: Record<string, UserAnswer>;
  startTime: number;
  durationMinutes: number;
  timeRemainingSeconds: number;
  completed: boolean;
  scorePercentage?: number;
  earnedRank?: RankTitle;
  proctoringReport?: ProctoringReport;
}

export interface TestResult {
  id: string;
  techId: string;
  techName: string;
  date: string;
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  earnedRank: RankTitle;
  timeTakenMinutes: number;
  topicBreakdown: Record<string, { total: number; correct: number; percentage: number }>;
  status?: 'COMPLETED' | 'CANCELLED_SUSPICIOUS';
  proctoringReport?: ProctoringReport;
}

export interface CandidateAttemptRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  techId: string;
  techName: string;
  date: string;
  scorePercentage: number;
  correctAnswers: number;
  totalQuestions: number;
  earnedRank: RankTitle;
  timeTakenMinutes: number;
  status: 'COMPLETED' | 'CANCELLED_SUSPICIOUS';
  terminationReason?: string;
  proctoringReport: ProctoringReport;
  restrictedUntil?: string;
}
