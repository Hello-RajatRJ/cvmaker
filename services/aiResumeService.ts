import { ATSScoreBreakdown, ResumeData } from '../types/resume';

export class AIResumeService {
  /**
   * Calculate live real-time ATS score (0-100) and gap analysis breakdown
   */
  static calculateATSScore(resume: ResumeData, targetJobDescription?: string): ATSScoreBreakdown {
    const resumeText = JSON.stringify(resume).toLowerCase();
    
    // Core Tech Keywords to test against
    const targetKeywords = targetJobDescription
      ? targetJobDescription.toLowerCase().match(/\b[a-z0-9+#.-]{3,}\b/g) || []
      : ['react', 'next.js', 'typescript', 'node.js', 'sql', 'aws', 'docker', 'system design', 'rest api', 'ci/cd', 'microservices', 'graphql'];

    const uniqueTargetKeywords = Array.from(new Set(targetKeywords)).filter(k => k.length > 2);
    
    const matchedKeywords: string[] = [];
    const missingKeywords: string[] = [];

    uniqueTargetKeywords.forEach((kw) => {
      if (resumeText.includes(kw)) {
        matchedKeywords.push(kw);
      } else {
        missingKeywords.push(kw);
      }
    });

    // Sub-scores
    const keywordRatio = uniqueTargetKeywords.length > 0
      ? matchedKeywords.length / uniqueTargetKeywords.length
      : 0.85;

    const keywordMatchScore = Math.min(100, Math.round(keywordRatio * 100));

    // Formatting Score based on sections filled
    let formattingScore = 60;
    if (resume.contact.email && resume.contact.phone) formattingScore += 10;
    if (resume.experience.length >= 2) formattingScore += 15;
    if (resume.education.length >= 1) formattingScore += 10;
    if (resume.skills.length >= 2) formattingScore += 5;

    // Experience relevance score
    const totalHighlights = resume.experience.reduce((sum, e) => sum + e.highlights.length, 0);
    const experienceRelevanceScore = Math.min(100, 50 + totalHighlights * 8);

    // Skills completeness score
    const totalSkillsCount = resume.skills.reduce((sum, s) => sum + s.skills.length, 0);
    const skillsCompletenessScore = Math.min(100, 40 + totalSkillsCount * 5);

    // Weighted Overall ATS Score
    const overallScore = Math.round(
      keywordMatchScore * 0.4 +
      formattingScore * 0.2 +
      experienceRelevanceScore * 0.2 +
      skillsCompletenessScore * 0.2
    );

    const suggestions: string[] = [];
    if (missingKeywords.length > 0) {
      suggestions.push(`Add missing high-impact keywords: ${missingKeywords.slice(0, 5).join(', ')}`);
    }
    if (totalHighlights < 4) {
      suggestions.push('Expand experience section with quantifiable metric bullet points (e.g. reduced latency by 45%).');
    }
    if (!resume.contact.linkedin || !resume.contact.github) {
      suggestions.push('Include LinkedIn & GitHub URLs in header contact info to improve candidate credibility score.');
    }

    return {
      overallScore,
      keywordMatchScore,
      formattingScore: Math.min(100, formattingScore),
      experienceRelevanceScore,
      skillsCompletenessScore,
      matchedKeywords,
      missingKeywords: missingKeywords.slice(0, 10),
      suggestions,
    };
  }

  /**
   * Client AI Bullet Optimizer Helper
   */
  static generateEnhancedBullet(originalBullet: string, role: string): string {
    if (!originalBullet || originalBullet.trim().length === 0) {
      return `Architected scalable ${role} microservices with Next.js & Node.js, improving throughput by 38%.`;
    }
    if (originalBullet.includes('%') || originalBullet.includes('reduced') || originalBullet.includes('boosted')) {
      return originalBullet;
    }
    return `Spearheaded ${originalBullet.trim()}, delivering a 42% latency reduction and optimizing memory consumption across cloud clusters.`;
  }
}
