export type TemplateId = string;

export interface ContactInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  address?: string;
  website: string;
  linkedin: string;
  github: string;
  summary: string;
  // Optional personal details
  dateOfBirth?: string;
  nationality?: string;
  workAuthorization?: string;
  // Professional summary extras
  yearsOfExperience?: string;
  targetJobTitle?: string;
  industry?: string;
  keyStrengths?: string[];
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  employmentType?: string; // full-time, part-time, contract, freelance, internship
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description?: string;
  highlights: string[];
  technologies?: string[];
  companyWebsite?: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  location?: string;
  studyMode?: string; // regular, distance, online
  startDate: string;
  endDate: string;
  current?: boolean;
  gpa?: string;
  coursework?: string[];
  academicAchievements?: string[];
  description?: string;
  highlights?: string[];
}

export interface Project {
  id: string;
  name: string;
  role?: string;
  projectType?: string;
  startDate?: string;
  endDate?: string;
  link?: string;
  repoLink?: string;
  technologies: string[];
  description: string;
  highlights: string[];
}

export interface SkillCategory {
  id: string;
  category: string;
  skills: string[];
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  expiryDate?: string;
  credentialId?: string;
  link?: string;
  neverExpires?: boolean;
}

export interface Language {
  id: string;
  name: string;
  proficiency: string; // native, fluent, professional, intermediate, basic
  certification?: string;
}

export interface Award {
  id: string;
  title: string;
  issuer: string;
  date: string;
  description?: string;
}

export interface Publication {
  id: string;
  title: string;
  publisher: string;
  date: string;
  url?: string;
  description?: string;
}

export interface VolunteerExperience {
  id: string;
  organization: string;
  role: string;
  startDate: string;
  endDate: string;
  current?: boolean;
  description?: string;
  highlights?: string[];
}

export type SectionKey =
  | 'summary'
  | 'experience'
  | 'education'
  | 'projects'
  | 'skills'
  | 'certifications'
  | 'languages'
  | 'awards'
  | 'publications'
  | 'volunteer';

export interface ResumeData {
  contact: ContactInfo;
  experience: WorkExperience[];
  education: Education[];
  projects: Project[];
  skills: SkillCategory[];
  certifications: Certification[];
  languages?: Language[];
  awards?: Award[];
  publications?: Publication[];
  volunteer?: VolunteerExperience[];
  customSections?: { id: string; title: string; items: string[] }[];
  sectionOrder?: SectionKey[];
  visibleSections?: Record<SectionKey, boolean>;
}

export type RequirementCategory = 'confirmed' | 'potential' | 'missing' | 'not_applicable';

export interface KeywordAnalysisItem {
  keyword: string;
  category: RequirementCategory;
  question?: string;
  options?: string[];
  userAnswer?: string;
  inferredFrom?: string;
}

export interface OptimizationChange {
  id: string;
  section: 'summary' | 'experience' | 'skills' | 'projects' | 'education' | 'certifications';
  sectionTitle: string;
  targetId?: string;
  field?: string;
  bulletIndex?: number;
  originalText: string;
  optimizedText: string;
  reason: string;
  relatedRequirement: string;
  status: 'pending' | 'accepted' | 'rejected';
  requiresConfirmation: boolean;
  isFactualCorrection?: boolean;
}

export interface OptimizationDraft {
  id: string;
  createdAt: string;
  targetJobDescription: string;
  changes: OptimizationChange[];
  potentialMatches: KeywordAnalysisItem[];
  missingChecklist: { requirement: string; advice: string }[];
  optimizedResume: ResumeData;
  originalResume: ResumeData;
  previousScore: number;
}

export interface ATSScoreBreakdown {
  overallScore: number;
  keywordMatchScore: number;
  formattingScore: number;
  experienceRelevanceScore: number;
  skillsCompletenessScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
  confirmedKeywords?: string[];
  potentialKeywords?: KeywordAnalysisItem[];
  experienceGaps?: string[];
  readabilityWarnings?: string[];
  scoreExplanation?: string;
  previousScore?: number;
}

export interface TemplateConfig {
  id: string;
  name: string;
  badge: string;
  category: string;
  description: string;
  isPaid: boolean;
  priceInINR: number;
  layout: 'single-column' | 'two-column' | 'sidebar-left' | 'sidebar-right';
  headerStyle: 'centered' | 'left-aligned' | 'bold-stripe' | 'minimal' | 'split' | 'banner';
  sectionDivider: 'line' | 'double-line' | 'dot' | 'none' | 'accent-bar' | 'thick-underline';
  fontProfile: 'sans' | 'serif' | 'mono' | 'mixed';
  spacing: 'compact' | 'normal' | 'relaxed';
  skillsDisplay: 'inline' | 'badges' | 'bars' | 'columns' | 'tags';
  projectStyle: 'card' | 'list' | 'timeline' | 'inline';
  defaultAccent: string;
  headerBg?: string;
  headerTextColor?: string;
  bodyBg?: string;
  sectionTitleCase?: 'uppercase' | 'capitalize' | 'normal';
  showProjectBullets: boolean;
  showTechBadges: boolean;
  showDuration: boolean;
  showRole: boolean;
  showLinks: boolean;
}
