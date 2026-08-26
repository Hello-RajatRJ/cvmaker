export type TemplateId = string;

export interface ContactInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  summary: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  highlights: string[];
  technologies?: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  highlights?: string[];
}

export interface Project {
  id: string;
  name: string;
  role?: string;
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
}

export type SectionKey = 'summary' | 'experience' | 'education' | 'projects' | 'skills' | 'certifications';

export interface ResumeData {
  contact: ContactInfo;
  experience: WorkExperience[];
  education: Education[];
  projects: Project[];
  skills: SkillCategory[];
  certifications: Certification[];
  customSections?: { id: string; title: string; items: string[] }[];
  sectionOrder?: SectionKey[];
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
