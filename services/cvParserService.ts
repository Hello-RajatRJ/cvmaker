import { ResumeData, WorkExperience, Education, Project, SkillCategory, Certification } from '../types/resume';
import { CVSemanticParser } from '../utils/cvSemanticParser';
import { normalizeToMonthYear } from '../utils/formatDate';

export class CVParserService {
  /**
   * Parse ANY file (CSV, PDF, DOCX, TXT) via the backend API.
   * Returns canonical ResumeData normalized for the application.
   */
  static async parseFile(file: File): Promise<Partial<ResumeData>> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/parse-file', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Server returned status ${res.status}`);
    }

    const json = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.error || 'Failed to extract data from file');
    }

    return this.normalizeResumeData(json.data);
  }

  /**
   * CSV-specific: passes through the unified parseFile route
   */
  static async extractAndParseCSV(file: File): Promise<Partial<ResumeData>> {
    return this.parseFile(file);
  }

  /**
   * Client-side CSV text parsing (used by "Load Sample Data" button)
   */
  static parseCSVText(csvText: string): Partial<ResumeData> {
    const canonical = CVSemanticParser.parse(csvText);
    return this.normalizeResumeData(canonical);
  }

  /**
   * Normalize any input (canonical or partial) into standard ResumeData schema.
   *
   * DESIGN PRINCIPLE: Never fabricate data. Pass through empty values.
   * The form editor and template renderer handle empty states gracefully.
   */
  static normalizeResumeData(raw: any): Partial<ResumeData> {
    if (!raw) return {};

    const contactRaw = raw.contact || raw.personalInfo || raw.personalDetails || {};
    const contact = {
      fullName: contactRaw.fullName || contactRaw.name || contactRaw.candidateName || '',
      jobTitle: contactRaw.jobTitle || contactRaw.title || contactRaw.position || contactRaw.role || '',
      email: contactRaw.email || '',
      phone: contactRaw.phone || contactRaw.mobile || '',
      location: contactRaw.location || contactRaw.city || '',
      website: contactRaw.website || contactRaw.portfolio || contactRaw.url || '',
      linkedin: contactRaw.linkedin || contactRaw.linkedInUrl || '',
      github: contactRaw.github || contactRaw.gitHubUrl || '',
      summary: contactRaw.summary || contactRaw.profile || contactRaw.about || contactRaw.objective || '',
    };

    // Experience normalization — preserve original data, no fabrication
    const rawExp = raw.experience || raw.workExperiences || raw.workExperience || [];
    const experience: WorkExperience[] = Array.isArray(rawExp)
      ? rawExp.map((e: any, idx: number) => ({
          id: e.id || `exp-${Date.now()}-${idx + 1}`,
          company: e.company || e.companyName || e.organization || '',
          position: e.position || e.jobTitle || e.role || '',
          location: e.location || '',
          startDate: normalizeToMonthYear(e.startDate || e.start || ''),
          endDate: normalizeToMonthYear(e.endDate || e.end || (e.current ? 'Present' : '')),
          current: Boolean(e.current || e.isCurrent || (e.endDate && /present|current/i.test(e.endDate))),
          highlights: Array.isArray(e.highlights) && e.highlights.length > 0
            ? e.highlights
            : Array.isArray(e.responsibilities) && e.responsibilities.length > 0
            ? e.responsibilities
            : e.description ? [e.description] : [],
          technologies: Array.isArray(e.technologies) ? e.technologies : [],
        }))
      : [];

    // Education normalization
    const rawEdu = raw.education || raw.educations || raw.academicDetails || [];
    const education: Education[] = Array.isArray(rawEdu)
      ? rawEdu.map((e: any, idx: number) => ({
          id: e.id || `edu-${Date.now()}-${idx + 1}`,
          institution: e.institution || e.school || e.university || e.college || '',
          degree: e.degree || e.qualification || '',
          fieldOfStudy: e.fieldOfStudy || e.field || e.major || '',
          startDate: normalizeToMonthYear(e.startDate || ''),
          endDate: normalizeToMonthYear(e.endDate || ''),
          gpa: e.gpa || e.grade || e.percentage || '',
          highlights: Array.isArray(e.highlights) ? e.highlights : [],
        }))
      : [];

    // Skills normalization
    const rawSkills = raw.skills || raw.skillCategories || raw.technicalSkills || [];
    const skills: SkillCategory[] = Array.isArray(rawSkills)
      ? rawSkills.map((s: any, idx: number) => ({
          id: s.id || `skills-${idx + 1}`,
          category: s.category || s.categoryName || s.name || '',
          skills: Array.isArray(s.skills) ? s.skills : Array.isArray(s.items) ? s.items : [],
        }))
      : [];

    // Projects normalization
    const rawProj = raw.projects || raw.projectItems || [];
    const projects: Project[] = Array.isArray(rawProj)
      ? rawProj.map((p: any, idx: number) => ({
          id: p.id || `proj-${Date.now()}-${idx + 1}`,
          name: p.name || p.title || p.projectName || '',
          role: p.role || '',
          startDate: normalizeToMonthYear(p.startDate || '') || undefined,
          endDate: normalizeToMonthYear(p.endDate || '') || undefined,
          link: p.link || p.url || p.projectUrl || '',
          repoLink: p.repoLink || p.github || p.githubUrl || '',
          technologies: Array.isArray(p.technologies) ? p.technologies : Array.isArray(p.techStack) ? p.techStack : [],
          description: p.description || '',
          highlights: Array.isArray(p.highlights) ? p.highlights : [],
        }))
      : [];

    // Certifications normalization
    const rawCerts = raw.certifications || raw.certificates || [];
    const certifications: Certification[] = Array.isArray(rawCerts)
      ? rawCerts.map((c: any, idx: number) => ({
          id: c.id || `cert-${Date.now()}-${idx + 1}`,
          name: c.name || c.title || c.certificationName || '',
          issuer: c.issuer || c.issuingOrganization || c.organization || '',
          date: c.date || c.issueDate || '',
          expiryDate: c.expiryDate || '',
          credentialId: c.credentialId || '',
          link: c.link || c.credentialUrl || '',
        }))
      : [];

    // Log normalization summary
    console.log('[CVNormalizer] Normalization complete:');
    console.log(`[CVNormalizer]   Contact: "${contact.fullName}" <${contact.email}>`);
    console.log(`[CVNormalizer]   ${experience.length} experience, ${education.length} education, ${skills.length} skill categories, ${projects.length} projects, ${certifications.length} certifications`);

    return {
      contact,
      experience,
      education,
      skills,
      projects,
      certifications,
    };
  }
}
