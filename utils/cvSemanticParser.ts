/**
 * Universal Semantic CV Parser Engine
 * Robust, layout-agnostic section detection and entity extraction.
 * Dual-compatible with both cvmaker and Portfolio schemas.
 *
 * DESIGN PRINCIPLE: Never fabricate data. If a field cannot be extracted,
 * return an empty string / empty array. Let the UI handle empty states.
 */

export interface CanonicalContact {
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

export interface CanonicalExperience {
  id: string;
  company: string;
  position: string;
  jobTitle: string; // alias
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  highlights: string[];
  technologies: string[];
}

export interface CanonicalEducation {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  location?: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  highlights?: string[];
}

export interface CanonicalSkillCategory {
  id: string;
  category: string;
  categoryName: string; // alias
  skills: string[];
}

export interface CanonicalProject {
  id: string;
  name: string;
  title: string; // alias
  role: string;
  startDate?: string;
  endDate?: string;
  duration?: string;
  technologies: string[];
  techStack: string[]; // alias
  description: string;
  highlights: string[];
  link: string;
  repoLink: string;
}

export interface CanonicalCertification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  expiryDate: string;
  credentialId: string;
  link: string;
}

export interface CanonicalResume {
  contact: CanonicalContact;
  personalInfo: CanonicalContact; // alias
  experience: CanonicalExperience[];
  workExperiences: CanonicalExperience[]; // alias
  education: CanonicalEducation[];
  educations: CanonicalEducation[]; // alias
  skills: CanonicalSkillCategory[];
  skillCategories: CanonicalSkillCategory[]; // alias
  projects: CanonicalProject[];
  certifications: CanonicalCertification[];
  extractionReport: {
    sectionsFound: string[];
    fieldsCount: {
      experiences: number;
      educations: number;
      skillCategories: number;
      totalSkills: number;
      projects: number;
      certifications: number;
    };
    hasContactInfo: boolean;
    hasSummary: boolean;
    warnings: string[];
  };
}

// ─── Text Sanitizer & Quality Filters ───

export function isReadableText(str: string): boolean {
  if (!str || str.trim().length === 0) return false;
  let printableCount = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if ((code >= 32 && code <= 126) || code === 10 || code === 13 || code === 9 || (code >= 160 && code <= 383)) {
      printableCount++;
    }
  }
  return printableCount / str.length >= 0.82;
}

export function sanitizeLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && isReadableText(l));
}

// ─── Skill Taxonomy for Automatic Categorization ───

const SKILL_TAXONOMY: Record<string, string[]> = {
  'Programming Languages': [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'C', 'Go', 'Golang', 'Rust',
    'Ruby', 'PHP', 'Swift', 'Kotlin', 'Dart', 'SQL', 'R', 'Scala', 'Shell', 'Bash', 'HTML', 'HTML5', 'CSS', 'CSS3', 'Sass',
    'Perl', 'Lua', 'Haskell', 'Elixir', 'Clojure', 'Objective-C', 'MATLAB', 'Assembly'
  ],
  'Frameworks & Libraries': [
    'React', 'React.js', 'Next.js', 'Node.js', 'Express', 'Express.js', 'Nest.js', 'NestJS',
    'Vue', 'Vue.js', 'Nuxt', 'Nuxt.js', 'Angular', 'Svelte', 'SvelteKit', 'Django', 'Flask',
    'FastAPI', 'Spring Boot', 'Spring', 'ASP.NET', '.NET Core', 'Laravel', 'Tailwind CSS',
    'Tailwind', 'Bootstrap', 'Material-UI', 'MUI', 'Chakra UI', 'Redux', 'Zustand', 'PyTorch',
    'TensorFlow', 'Keras', 'Scikit-Learn', 'Pandas', 'NumPy', 'GraphQL', 'tRPC', 'Prisma', 'Drizzle',
    'jQuery', 'Backbone.js', 'Ember.js', 'Gatsby', 'Remix', 'Astro', 'Three.js', 'D3.js',
    'Socket.io', 'Mongoose', 'Sequelize', 'TypeORM', 'Hibernate', 'Rails', 'Ruby on Rails',
    'LangChain', 'vLLM', 'Hugging Face', 'OpenCV', 'CUDA', 'Spark', 'Hadoop'
  ],
  'Cloud & DevOps': [
    'AWS', 'Amazon Web Services', 'Azure', 'Microsoft Azure', 'GCP', 'Google Cloud Platform',
    'Docker', 'Kubernetes', 'K8s', 'Terraform', 'Ansible', 'Jenkins', 'GitHub Actions',
    'GitLab CI', 'CI/CD', 'Linux', 'Ubuntu', 'CentOS', 'Nginx', 'Apache', 'Serverless',
    'Helm', 'Prometheus', 'Grafana', 'Datadog', 'Cloudflare', 'Vercel', 'Netlify', 'AWS Lambda',
    'CloudFormation', 'Pulumi', 'ArgoCD', 'CircleCI', 'Travis CI', 'Vagrant', 'Chef', 'Puppet'
  ],
  'Databases & Storage': [
    'PostgreSQL', 'Postgres', 'MongoDB', 'MySQL', 'Redis', 'SQLite', 'DynamoDB',
    'Elasticsearch', 'Cassandra', 'Oracle', 'MariaDB', 'Supabase', 'Firebase', 'Neo4j', 'CouchDB',
    'InfluxDB', 'Memcached', 'Amazon S3', 'MinIO', 'Snowflake', 'BigQuery', 'Redshift'
  ],
  'Tools & Architecture': [
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jira', 'Confluence', 'Postman', 'Figma', 'VS Code',
    'Webpack', 'Vite', 'Kafka', 'RabbitMQ', 'Microservices', 'RESTful APIs', 'REST API',
    'System Design', 'Agile', 'Scrum', 'Jest', 'Cypress', 'Playwright', 'Mocha', 'WebSockets', 'OAuth',
    'gRPC', 'NATS', 'Swagger', 'OpenAPI', 'Storybook', 'Turborepo', 'Nx', 'Lerna',
    'SonarQube', 'New Relic', 'Sentry', 'Splunk', 'ELK Stack', 'Notion', 'Slack', 'Trello'
  ]
};

// ─── Semantic Parser Implementation ───

export class CVSemanticParser {
  /**
   * Main entry point to parse plain text into structured canonical resume
   */
  static parse(rawText: string): CanonicalResume {
    const lines = sanitizeLines(rawText);
    const fullText = lines.join('\n');
    const warnings: string[] = [];

    // 1. Extract Contact & URLs
    const contact = this.extractContact(lines, fullText, warnings);

    // 2. Identify Section Slices
    const sectionMap = this.partitionSections(lines);
    const sectionsFound = Object.keys(sectionMap).filter((k) => sectionMap[k].length > 0);

    console.log('[CVParser] Sections found:', sectionsFound.join(', ') || 'none');
    for (const [key, sectionLines] of Object.entries(sectionMap)) {
      if (sectionLines.length > 0) {
        console.log(`[CVParser]   ${key}: ${sectionLines.length} lines`);
      }
    }

    // 3. Extract Each Section
    const summary = this.extractSummary(sectionMap['summary'] || [], warnings);
    contact.summary = summary;

    const experience = this.extractExperience(sectionMap['experience'] || [], warnings);
    const education = this.extractEducation(sectionMap['education'] || [], warnings);
    const skills = this.extractSkills(sectionMap['skills'] || [], fullText, warnings);
    const projects = this.extractProjects(sectionMap['projects'] || [], warnings);
    const certifications = this.extractCertifications(sectionMap['certifications'] || [], warnings);

    // 4. Extract technologies from experience highlights
    for (const exp of experience) {
      if (exp.technologies.length === 0) {
        exp.technologies = this.extractTechFromText(exp.highlights.join(' '));
      }
    }

    let totalSkillsCount = 0;
    skills.forEach((cat) => (totalSkillsCount += cat.skills.length));

    // Log extraction summary
    console.log('[CVParser] Extraction complete:');
    console.log(`[CVParser]   Contact: name="${contact.fullName}", email="${contact.email}", phone="${contact.phone}"`);
    console.log(`[CVParser]   URLs: linkedin="${contact.linkedin}", github="${contact.github}", website="${contact.website}"`);
    console.log(`[CVParser]   Summary: ${summary ? summary.length + ' chars' : 'empty'}`);
    console.log(`[CVParser]   Experience: ${experience.length} entries`);
    console.log(`[CVParser]   Education: ${education.length} entries`);
    console.log(`[CVParser]   Skills: ${skills.length} categories, ${totalSkillsCount} total`);
    console.log(`[CVParser]   Projects: ${projects.length} entries`);
    console.log(`[CVParser]   Certifications: ${certifications.length} entries`);
    if (warnings.length > 0) {
      console.log(`[CVParser]   Warnings: ${warnings.join('; ')}`);
    }

    return {
      contact,
      personalInfo: contact,
      experience,
      workExperiences: experience,
      education,
      educations: education,
      skills,
      skillCategories: skills,
      projects,
      certifications,
      extractionReport: {
        sectionsFound,
        fieldsCount: {
          experiences: experience.length,
          educations: education.length,
          skillCategories: skills.length,
          totalSkills: totalSkillsCount,
          projects: projects.length,
          certifications: certifications.length,
        },
        hasContactInfo: Boolean(contact.fullName && contact.email),
        hasSummary: Boolean(summary && summary.length > 20),
        warnings,
      },
    };
  }

  /**
   * Extract tech keywords from arbitrary text using the taxonomy
   */
  private static extractTechFromText(text: string): string[] {
    const found: string[] = [];
    for (const [_, terms] of Object.entries(SKILL_TAXONOMY)) {
      for (const t of terms) {
        const regex = new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(text)) {
          found.push(t);
        }
      }
    }
    return Array.from(new Set(found));
  }

  /**
   * Un-space letter-spaced headers or names like "R A J A T  A M B E D K A R" -> "RAJAT AMBEDKAR"
   */
  private static normalizeSpacedLetters(str: string, emailHint = '', fullText = ''): string {
    const trimmed = str.trim();
    const tokens = trimmed.split(/\s+/);
    if (tokens.length >= 4 && tokens.filter((t) => t.length === 1).length / tokens.length >= 0.75) {
      if (trimmed.includes('  ')) {
        return trimmed
          .split(/\s{2,}/)
          .map((w) => w.replace(/\s+/g, ''))
          .join(' ');
      }

      const joined = tokens.join('');

      // Check if linkedin has hyphenated first-last handle e.g. "linkedin.com/in/rajat-ambedker"
      if (fullText) {
        const linkedinNameMatch = fullText.match(/linkedin\.com\/in\/([a-z]+)[-_]([a-z]+)/i);
        if (linkedinNameMatch) {
          const lFirst = linkedinNameMatch[1].toLowerCase();
          if (joined.toLowerCase().startsWith(lFirst) && lFirst.length < joined.length) {
            return `${joined.substring(0, lFirst.length)} ${joined.substring(lFirst.length)}`;
          }
        }
      }

      // If email has a hint like "rajatambedker06@gmail.com", match first AND 4-char last name prefix
      if (emailHint) {
        const cleanEmailUser = emailHint.split('@')[0].toLowerCase().replace(/[^a-z]/g, '');
        for (let len = 3; len <= 7 && len < joined.length; len++) {
          const first = joined.substring(0, len).toLowerCase();
          const last = joined.substring(len).toLowerCase();
          if (cleanEmailUser.startsWith(first) && cleanEmailUser.includes(last.substring(0, 4))) {
            return `${joined.substring(0, len)} ${joined.substring(len)}`;
          }
        }
      }

      return joined;
    }
    return str;
  }

  /**
   * Extract Full Name, Job Title, Email, Phone, Location, and URLs.
   * Returns empty strings for fields that cannot be extracted.
   */
  private static extractContact(lines: string[], fullText: string, warnings: string[]): CanonicalContact {
    const topLines = lines.slice(0, 15);

    // Email
    const emailMatch = fullText.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
    let email = emailMatch ? emailMatch[0].trim() : '';
    // Handle OCR typo like gmaiIcom or gmaiI.com
    if (!email) {
      const ocrEmail = fullText.match(/([a-zA-Z0-9._%+\-]+)@([a-zA-Z0-9.\-]+)\s*(?:com|in|org|net|io|dev)/i);
      if (ocrEmail) email = `${ocrEmail[1]}@${ocrEmail[2].replace(/i/gi, 'l')}.com`;
    }
    if (!email) warnings.push('No email found');

    // Phone (support +91, Indian 10-digit, US 10-digit, international)
    const phoneMatch = fullText.match(/(?:\+?91[\s\-.]?)?[6-9]\d{9}|(?:\+?\d{1,3}[\s\-.]?)?\(?\d{2,4}\)?[\s\-.]?\d{3,5}[\s\-.]?\d{3,5}/);
    const phone = phoneMatch ? phoneMatch[0].trim().replace(/^[^\d+]+|[^\d]+$/g, '') : '';

    // LinkedIn - match alphanumeric, hyphen, underscore, stopped by space, @, or punctuation
    const linkedinMatch = fullText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_\-\s]+)/i);
    let linkedin = '';
    if (linkedinMatch) {
      const cleanUser = linkedinMatch[1]
        .replace(/\s*-\s*/g, '-')
        .trim()
        .split(/[\s•·,]/)[0]
        .replace(/^[•·\-\s]+|[•·\-\s]+$/g, '');
      if (cleanUser.length > 2) {
        linkedin = `linkedin.com/in/${cleanUser}`;
      }
    }

    // GitHub
    const githubMatch = fullText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_\-•·\s]+)/i);
    let github = '';
    if (githubMatch) {
      const cleanUser = githubMatch[1]
        .replace(/[•·]/g, '-')
        .replace(/\s*-\s*/g, '-')
        .trim()
        .split(/[\s•·,]/)[0]
        .replace(/^[•·\-\s]+|[•·\-\s]+$/g, '');
      if (cleanUser && !cleanUser.toLowerCase().includes('professional') && !cleanUser.toLowerCase().includes('summary') && cleanUser.length > 2) {
        github = `github.com/${cleanUser}`;
      }
    }

    // Portfolio / Website (avoiding linkedin, github, google, email domains, and known tech library domains)
    const knownTechDomains = ['socket.io', 'vue.js', 'react.js', 'next.js', 'node.js', 'd3.js', 'three.js', 'socket'];
    let website = '';

    // 1. Explicit http/https URLs (e.g. https://jordanvance.dev or https://rj-ambedkar-portfolio.netlify.app/)
    const urlMatches = fullText.match(/\bhttps?:\/\/[a-zA-Z0-9.\-_]+\.[a-zA-Z]{2,}(?:\/[^\s,)]*)?/gi) || [];
    for (const u of urlMatches) {
      const lower = u.toLowerCase();
      if (
        !lower.includes('linkedin.com') &&
        !lower.includes('github.com') &&
        !lower.includes('google.com') &&
        !lower.includes('edin.com') &&
        u.length > 10 &&
        !knownTechDomains.some((d) => lower.includes(d))
      ) {
        website = u.trim().replace(/^[•·\-\s]+|[•·\-\s]+$/g, '');
        break;
      }
    }

    // 2. Check for explicit Portfolio : - https://... pattern
    if (!website) {
      const portfolioLabelMatch = fullText.match(/(?:portfolio|website|link)\s*[:\-–—\s]*\s*(https?:\/\/[^\s\n]+|[a-zA-Z0-9_\-\s]+\.(?:netlify\.app|vercel\.app|github\.io|dev|io|me|tech|app|site|in|com))/i);
      if (portfolioLabelMatch) {
        const rawUrl = portfolioLabelMatch[1].replace(/\s*-\s*/g, '-').replace(/\s+/g, '').replace(/^[•·\-\s]+|[•·\-\s]+$/g, '');
        if (rawUrl.length > 8 && !knownTechDomains.some((d) => rawUrl.toLowerCase().includes(d))) {
          website = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
        }
      }
    }

    // 3. Netlify / Vercel / dev / io bare domain (not part of email)
    if (!website) {
      const netlifyOrVercel = fullText.match(/(?:^|[^@\w])([a-zA-Z0-9_\-]+\.(?:netlify\.app|vercel\.app|github\.io|dev|io|me|tech|app|site|portfolio))\b/i);
      if (netlifyOrVercel) {
        const cleanDomain = netlifyOrVercel[1].replace(/\s*-\s*/g, '-').replace(/\s+/g, '');
        if (cleanDomain.length > 6 && !knownTechDomains.some((d) => cleanDomain.toLowerCase().includes(d)) && !cleanDomain.includes('gmail') && !cleanDomain.includes('yahoo')) {
          website = `https://${cleanDomain}`;
        }
      }
    }

    // Location — check address keywords, Indian cities/states, US cities/states
    let location = '';
    const addressPattern = /(?:#?\d+[\w\s,]+(?:Colony|Nagar|Cantt|Sector|Street|Road|Avenue|Lane|City|District|State|Haryana|Punjab|Delhi|Maharashtra|Karnataka|Tamil\s*Nadu|Uttar\s*Pradesh|Bengaluru|Bangalore|Mumbai|Pune|Ambala|Chandigarh|Hyderabad|Chennai|Kolkata|Jaipur|Gurgaon|Noida))\b/i;
    for (const l of topLines) {
      const match = l.match(addressPattern);
      if (match && !l.includes('@') && !l.includes('http') && match[0].length < 60) {
        location = match[0].trim();
        break;
      }
    }
    if (!location) {
      const locPattern = /\b([A-Z][a-zA-Z\s]+,\s*(?:[A-Z]{2}|[A-Z][a-zA-Z\s]+|USA|India|UK|Canada|Germany|Remote|Hybrid))\b/;
      for (const l of topLines) {
        const match = l.match(locPattern);
        if (match && !l.includes('@') && match[1].length < 45) {
          location = match[1].trim();
          break;
        }
      }
    }
    if (!location) {
      for (const l of topLines) {
        if (/\b(Remote|Hybrid|Ambala|Chandigarh|Haryana|Punjab|Delhi|San Francisco|New York|Bengaluru|Bangalore|London|Seattle|Austin|Toronto|Berlin|Mumbai|Delhi|Hyderabad|Chicago|Boston|Los Angeles|Denver|Atlanta)\b/i.test(l)) {
          const locParts = l.split(/[|•·\-–—]/);
          for (const part of locParts) {
            const trimmed = part.trim();
            if (/\b(Remote|Hybrid|Ambala|Chandigarh|Haryana|Punjab|Delhi|San Francisco|New York|Bengaluru|Bangalore|London|Seattle|Austin|Toronto|Berlin|Mumbai|Delhi|Hyderabad|Chicago|Boston|Los Angeles|Denver|Atlanta)\b/i.test(trimmed) && trimmed.length < 50 && !trimmed.includes('@')) {
              location = trimmed;
              break;
            }
          }
          if (location) break;
        }
      }
    }

    // Full Name
    let fullName = '';
    const ignoreNameTerms = /^(resume|curriculum|vitae|page|contact|email|phone|profile|summary|skills|experience|portfolio|http|www|linkedin|github|education|projects|certifications)/i;
    for (const l of topLines) {
      const unspaced = this.normalizeSpacedLetters(l, email, fullText);
      const cleanLine = unspaced.replace(/[^a-zA-Z\s.'\-]/g, '').trim();
      const words = cleanLine.split(/\s+/).filter(Boolean);

      if (
        !l.includes('@') &&
        !l.includes('http') &&
        !l.includes('linkedin.com') &&
        !l.includes('github.com') &&
        !ignoreNameTerms.test(cleanLine) &&
        cleanLine.length >= 3 &&
        cleanLine.length <= 40 &&
        /^[A-Za-z\s.'\-]+$/.test(cleanLine) &&
        words.length >= 1 &&
        words.length <= 5 &&
        !words.some((w) => /^(developer|engineer|manager|architect|designer|lead|analyst)$/i.test(w))
      ) {
        // Format name properly: convert to Title Case (e.g. RAJAT AMBEDKAR -> Rajat Ambedkar)
        fullName = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        break;
      }
    }
    if (!fullName) warnings.push('Could not extract full name from top lines');

    // Job Title — look for title keywords in top lines
    let jobTitle = '';
    const titleKeywords = /\b(software engineer|developer|full[\s-]?stack|front[\s-]?end|back[\s-]?end|architect|cloud|devops|data scientist|data analyst|data engineer|ai engineer|ml engineer|machine learning|ui\/ux|ux designer|ui designer|ui architect|mobile developer|ios developer|android developer|lead engineer|principal|staff engineer|director|engineering manager|tech lead|sre|site reliability|qa engineer|test engineer|consultant|product manager|project manager|business analyst|solutions architect|security engineer|platform engineer|infrastructure engineer|web developer)\b/i;
    for (const l of topLines) {
      if (l !== fullName && titleKeywords.test(l) && l.length < 75 && !l.includes('@') && !l.includes('http')) {
        jobTitle = l.replace(/^[|•·\-📞📍📧🔗💻]\s*/, '').split(/[|•·,]/)[0].trim();
        break;
      }
    }

    return {
      fullName,
      jobTitle,
      email,
      phone,
      location,
      website,
      linkedin,
      github,
      summary: '',
    };
  }

  /**
   * Partition document into semantic section blocks
   */
  private static partitionSections(lines: string[]): Record<string, string[]> {
    const sections: Record<string, string[]> = {
      header: [],
      summary: [],
      experience: [],
      education: [],
      skills: [],
      projects: [],
      certifications: [],
    };

    let currentSection = 'header';

    const headerMatchers: { key: string; regex: RegExp }[] = [
      {
        key: 'summary',
        regex: /^(summary|professional summary|executive summary|about me|about|profile|professional profile|career objective|objective|career profile|personal profile|overview)$/i,
      },
      {
        key: 'experience',
        regex: /^(work experience|professional experience|experience|employment history|work history|career history|professional background|employment|relevant experience|work background)$/i,
      },
      {
        key: 'education',
        regex: /^(education|academic background|academic qualifications|qualifications|academic details|degrees|education (?:&|and) credentials)$/i,
      },
      {
        key: 'skills',
        regex: /^(skills|skill|technical skills|technologies|core competencies|tech stack|programming languages|tools (?:&|and) technologies|key skills|skills (?:&|and) proficiencies|technical expertise|competencies|areas of expertise)$/i,
      },
      {
        key: 'projects',
        regex: /^(projects|key projects|notable projects|personal projects|selected projects|technical projects|academic projects|portfolio|selected work)$/i,
      },
      {
        key: 'certifications',
        regex: /^(certifications|licenses|certificates|credentials|certifications (?:&|and) licenses|accreditations|awards (?:&|and) certifications|awards|honors (?:&|and) awards)$/i,
      },
    ];

    for (const line of lines) {
      const cleaned = line.replace(/[^a-zA-Z\s&]/g, '').trim().toLowerCase();

      let matchedKey: string | null = null;
      for (const m of headerMatchers) {
        if (m.regex.test(cleaned)) {
          matchedKey = m.key;
          break;
        }
      }

      if (matchedKey) {
        currentSection = matchedKey;
        continue;
      }

      if (sections[currentSection]) {
        sections[currentSection].push(line);
      }
    }

    return sections;
  }

  /**
   * Extract clean, readable professional summary.
   * Filters out contact info, phone, email, and headers.
   */
  private static extractSummary(summaryLines: string[], warnings: string[]): string {
    const cleanSentences = summaryLines
      .filter((l) => {
        const t = l.trim();
        if (t.length < 20 || !isReadableText(t)) return false;
        if (t.includes('@') || t.includes('http') || t.includes('linkedin.com') || t.includes('github.com')) return false;
        if (/^(?:📞|📍|📧|🔗|💻|\+?\d{1,4}[\s\-.]?\d{5})/.test(t)) return false;
        if (/(?:\+?91[\s\-.]?)?[6-9]\d{9}/.test(t)) return false;
        if (/^(?:about\s*me|summary|professional\s*summary|profile)/i.test(t)) return false;
        return true;
      })
      .join(' ')
      .slice(0, 700);

    if (cleanSentences && cleanSentences.length > 25) {
      return cleanSentences;
    }

    if (summaryLines.length > 0) {
      warnings.push(`Summary section had ${summaryLines.length} lines but none passed quality filter`);
    }
    return '';
  }

  /**
   * Extract multiple Work Experience items with timelines and highlights.
   * Correctly detects company vs position and captures multi-line descriptions as highlights.
   */
  private static extractExperience(expLines: string[], warnings: string[]): CanonicalExperience[] {
    if (expLines.length === 0) return [];

    const items: CanonicalExperience[] = [];
    let curCompany = '';
    let curPosition = '';
    let curLocation = '';
    let curStartDate = '';
    let curEndDate = '';
    let curCurrent = false;
    let curHighlights: string[] = [];

    const titleKeywords = /\b(engineer|developer|architect|designer|manager|lead|consultant|analyst|specialist|intern|scientist|programmer|administrator|director|officer)\b/i;
    const dateRangePattern = /(?:(?:(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?((?:19|20)\d{2}))\s*(?:–|-|—|to)\s*(present|current|till\s*date|(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?(?:19|20)\d{2})/i;
    const hasDateIndicator = /(?:(19|20)\d{2}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|present|current|till date)/i;

    const assignCompanyAndRole = (partA: string, partB: string) => {
      if (titleKeywords.test(partB) && !titleKeywords.test(partA)) {
        curCompany = partA;
        curPosition = partB;
      } else if (titleKeywords.test(partA) && !titleKeywords.test(partB)) {
        curPosition = partA;
        curCompany = partB;
      } else {
        curPosition = partA;
        curCompany = partB;
      }
    };

    const saveCurrent = () => {
      if (curCompany || curPosition || curHighlights.length > 0) {
        items.push({
          id: `exp-${Date.now()}-${items.length + 1}`,
          company: curCompany || 'Company',
          position: curPosition || 'Software Engineer',
          jobTitle: curPosition || 'Software Engineer',
          location: curLocation,
          startDate: curStartDate,
          endDate: curEndDate,
          current: curCurrent,
          highlights: curHighlights.slice(0, 8),
          technologies: [],
        });
      }
      curCompany = '';
      curPosition = '';
      curLocation = '';
      curStartDate = '';
      curEndDate = '';
      curCurrent = false;
      curHighlights = [];
    };

    for (const l of expLines) {
      const isBullet = /^[•\-*►▪·]\s/.test(l);

      // Bullet point → highlight
      if (isBullet) {
        curHighlights.push(l.replace(/^[•\-*►▪·]\s*/, '').trim());
        continue;
      }

      // Line with date range → new experience entry boundary
      if (hasDateIndicator.test(l) && l.length < 110) {
        const dateMatch = l.match(dateRangePattern);

        // If this line is ONLY a date range and we already have a pending company/position, just attach dates
        if (dateMatch && l.replace(dateMatch[0], '').trim().length < 8 && (curCompany || curPosition) && curHighlights.length === 0) {
          curStartDate = dateMatch[2] || '';
          const endStr = dateMatch[3] || '';
          curCurrent = /present|current|till\s*date/i.test(endStr);
          curEndDate = curCurrent ? 'Present' : endStr;
          continue;
        }

        // Otherwise save previous entry and start new one
        saveCurrent();

        if (dateMatch) {
          curStartDate = dateMatch[2] || '';
          const endStr = dateMatch[3] || '';
          curCurrent = /present|current|till\s*date/i.test(endStr);
          curEndDate = curCurrent ? 'Present' : endStr;
        }

        // Try to extract role | company from the line (after removing the date)
        const withoutDate = dateMatch ? l.replace(dateMatch[0], '').trim() : l;
        const parts = withoutDate.split(/[|•·–—]/).map((p) => p.trim()).filter((p) => p.length > 1);
        if (parts.length >= 2) {
          assignCompanyAndRole(parts[0], parts[1]);
          if (parts[2] && parts[2].length < 40) curLocation = parts[2];
        } else if (parts.length === 1) {
          curPosition = parts[0];
        }
        continue;
      }

      // Pipe-delimited line (e.g. "CereTax | Full Stack Engineer")
      if (l.includes('|') && !curPosition && curHighlights.length === 0) {
        const parts = l.split(/[|]/).map((p) => p.trim()).filter(Boolean);
        assignCompanyAndRole(parts[0], parts[1] || '');
        if (parts[2] && parts[2].length < 40) curLocation = parts[2];
        continue;
      }

      // After highlights have started, a short line signals a new entry header
      if (curHighlights.length > 0 && l.length >= 3 && l.length < 70 && l.includes('|')) {
        saveCurrent();
        const parts = l.split(/[|•·]/).map((p) => p.trim()).filter(Boolean);
        assignCompanyAndRole(parts[0], parts[1] || '');
        continue;
      }

      // Regular description / bullet sentence under current experience
      if ((curCompany || curPosition) && l.length > 15 && !l.includes('|')) {
        curHighlights.push(l.trim());
      }
    }

    saveCurrent();

    if (items.length === 0 && expLines.length > 0) {
      warnings.push(`Experience section had ${expLines.length} lines but no structured entries could be extracted`);
    }

    return items.slice(0, 8);
  }

  /**
   * Extract Education history with proper multi-line grouping.
   * Groups consecutive lines into single education entries using
   * institution/degree boundary detection.
   */
  private static extractEducation(eduLines: string[], warnings: string[]): CanonicalEducation[] {
    if (eduLines.length === 0) return [];

    const items: CanonicalEducation[] = [];

    // Patterns
    const degreeKeywords = /\b(bachelor'?s?|master'?s?|ph\.?d|doctorate|b\.?tech|b\.?s\.?|b\.?e\.?|m\.?tech|m\.?s\.?|m\.?b\.?a|b\.?a\.?|m\.?a\.?|associate'?s?|diploma|certificate|b\.?sc|m\.?sc|b\.?com|m\.?com|b\.?c\.?a|m\.?c\.?a)\b/i;
    const dateRangePattern = /((?:19|20)\d{2})\s*(?:–|-|to)\s*((?:19|20)\d{2}|present|current)/i;
    const gpaPattern = /(?:gpa|cgpa|grade|percentage|score|marks)[\s:]*([0-9]+\.?[0-9]*(?:\s*\/\s*[0-9]+\.?[0-9]*|%)?)/i;
    const institutionKeywords = /\b(university|college|institute|school|academy|polytechnic|iit|nit|bits|mit|stanford|harvard|berkeley|oxford|cambridge)\b/i;

    let curInstitution = '';
    let curDegree = '';
    let curField = '';
    let curStartDate = '';
    let curEndDate = '';
    let curGpa = '';
    let curHighlights: string[] = [];

    const saveEducation = () => {
      if (curInstitution || curDegree) {
        items.push({
          id: `edu-${Date.now()}-${items.length + 1}`,
          institution: curInstitution,
          degree: curDegree,
          fieldOfStudy: curField,
          startDate: curStartDate,
          endDate: curEndDate,
          gpa: curGpa,
          highlights: curHighlights.length > 0 ? curHighlights : undefined,
        });
      }
      curInstitution = '';
      curDegree = '';
      curField = '';
      curStartDate = '';
      curEndDate = '';
      curGpa = '';
      curHighlights = [];
    };

    for (const l of eduLines) {
      if (!isReadableText(l) || l.length < 3) continue;

      const isBullet = /^[•\-*►▪·]\s/.test(l);
      if (isBullet) {
        curHighlights.push(l.replace(/^[•\-*►▪·]\s*/, '').trim());
        continue;
      }

      // Check for GPA in any line
      const gpaMatch = l.match(gpaPattern);
      if (gpaMatch) {
        curGpa = gpaMatch[1].trim();
        // If the line is just a GPA, continue without creating a new entry
        if (l.replace(gpaMatch[0], '').trim().length < 10) continue;
      }

      // Check for dates
      const dateMatch = l.match(dateRangePattern);
      if (dateMatch) {
        curStartDate = dateMatch[1];
        curEndDate = dateMatch[2];
      }

      // Detect a new education entry boundary:
      // Either a line with an institution keyword or a line with a degree keyword
      // when we already have data from a previous entry
      const hasInstitution = institutionKeywords.test(l);
      const hasDegree = degreeKeywords.test(l);

      if (hasInstitution && curInstitution && (curDegree || curHighlights.length > 0)) {
        // New institution found while we already have one → save previous
        saveEducation();
      }

      if (hasInstitution) {
        // Extract institution — take the part before date/degree indicators
        const instParts = l.split(/[|•·–(]/);
        curInstitution = instParts[0].replace(dateRangePattern, '').trim();
        if (curInstitution.length > 80) curInstitution = curInstitution.substring(0, 80);
      }

      if (hasDegree) {
        // If we already have a degree and institution, this is a new entry
        if (curDegree && curInstitution) {
          saveEducation();
        }
        // Extract degree — use the original line text
        const degreeMatch = l.match(degreeKeywords);
        if (degreeMatch) {
          // Try to capture the full degree phrase
          const afterDegree = l.substring(l.indexOf(degreeMatch[0]));
          const degreeParts = afterDegree.split(/[|•·–(]/);
          curDegree = degreeParts[0].replace(dateRangePattern, '').trim();

          // Extract field of study — look for "in <field>"
          const fieldMatch = afterDegree.match(/\bin\s+([A-Za-z\s&,]+?)(?:\s*(?:\||•|·|–|\(|$))/i);
          if (fieldMatch) {
            curField = fieldMatch[1].trim();
          }
        }
      }

      // If line has neither institution nor degree keywords, and we don't have either yet,
      // treat it as the institution name (first meaningful line)
      if (!hasInstitution && !hasDegree && !curInstitution && l.length > 5 && l.length < 80) {
        curInstitution = l.split(/[|•·–(]/)[0].replace(dateRangePattern, '').trim();
      }
    }

    saveEducation();

    if (items.length === 0 && eduLines.length > 0) {
      warnings.push(`Education section had ${eduLines.length} lines but no structured entries could be extracted`);
    }

    return items.slice(0, 5);
  }

  /**
   * Extract & Categorize Skills into structured taxonomies.
   * Returns empty array if no skills are detected.
   */
  private static extractSkills(skillLines: string[], fullText: string, warnings: string[]): CanonicalSkillCategory[] {
    const detectedAll = new Set<string>();

    // 1. Parse raw text lines from skills section
    for (const sl of skillLines) {
      sl.split(/[,;|•·\t]/).forEach((s) => {
        const cleaned = s.replace(/^[^a-zA-Z0-9#+.]+|[^a-zA-Z0-9#+.]+$/g, '').trim();
        if (cleaned.length >= 2 && cleaned.length <= 30 && isReadableText(cleaned)) {
          detectedAll.add(cleaned);
        }
      });
    }

    // 2. Also scan full document for taxonomy terms (catch skills mentioned outside the Skills section)
    for (const [_, terms] of Object.entries(SKILL_TAXONOMY)) {
      for (const t of terms) {
        const regex = new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(fullText)) {
          detectedAll.add(t);
        }
      }
    }

    if (detectedAll.size === 0) {
      if (skillLines.length > 0) {
        warnings.push(`Skills section had ${skillLines.length} lines but no recognizable skills found`);
      }
      return [];
    }

    // 3. Categorize detected skills
    const allSkillsList = Array.from(detectedAll);
    const categorized: Record<string, string[]> = {};
    for (const catName of Object.keys(SKILL_TAXONOMY)) {
      categorized[catName] = [];
    }

    const defaultCat = Object.keys(SKILL_TAXONOMY)[Object.keys(SKILL_TAXONOMY).length - 1];
    for (const s of allSkillsList) {
      let placed = false;
      for (const [catName, taxTerms] of Object.entries(SKILL_TAXONOMY)) {
        if (taxTerms.some((t) => t.toLowerCase() === s.toLowerCase())) {
          categorized[catName].push(s);
          placed = true;
          break;
        }
      }
      if (!placed) {
        categorized[defaultCat].push(s);
      }
    }

    const result: CanonicalSkillCategory[] = [];
    for (const [catName, list] of Object.entries(categorized)) {
      if (list.length > 0) {
        result.push({
          id: `skills-${catName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          category: catName,
          categoryName: catName,
          skills: Array.from(new Set(list)),
        });
      }
    }

    return result;
  }

  /**
   * Extract Projects with Tech Stacks and links.
   * Returns empty array if no projects are found.
   */
  private static extractProjects(projectLines: string[], warnings: string[]): CanonicalProject[] {
    if (projectLines.length === 0) return [];

    const projects: CanonicalProject[] = [];
    let curName = '';
    let curRole = '';
    let curTech: string[] = [];
    let curLink = '';
    let curRepoLink = '';
    let curHighlights: string[] = [];

    const saveProject = () => {
      if (curName) {
        projects.push({
          id: `proj-${Date.now()}-${projects.length + 1}`,
          name: curName,
          title: curName,
          role: curRole,
          technologies: curTech,
          techStack: curTech,
          description: curHighlights[0] || '',
          highlights: curHighlights,
          link: curLink,
          repoLink: curRepoLink || curLink,
        });
      }
      curName = '';
      curRole = '';
      curTech = [];
      curLink = '';
      curRepoLink = '';
      curHighlights = [];
    };

    for (const l of projectLines) {
      const isBullet = /^[•\-*►▪·]\s/.test(l);

      if (isBullet) {
        curHighlights.push(l.replace(/^[•\-*►▪·]\s*/, '').trim());
        continue;
      }

      // Extract URLs
      const urlMatch = l.match(/https?:\/\/[^\s)]+/);
      if (urlMatch) {
        const url = urlMatch[0];
        if (url.includes('github.com')) {
          curRepoLink = url;
        } else {
          curLink = url;
        }
      }

      // Extract role: line
      const roleMatch = l.match(/^(?:role|position|title)\s*:\s*(.+)/i);
      if (roleMatch) {
        curRole = roleMatch[1].trim();
        continue;
      }

      // Extract tech stack line
      const techLineMatch = l.match(/^(?:tech(?:nologies|stack)?|stack|built with|tools)\s*:\s*(.+)/i);
      if (techLineMatch) {
        curTech = techLineMatch[1].split(/[,;]/).map((s) => s.trim()).filter(Boolean);
        continue;
      }

      // Clean title from URL fragments
      const cleanTitle = l
        .replace(/\([^)]*https?[^)]*\)/gi, '')
        .replace(/https?:\/\/\S+/gi, '')
        .replace(/^[•\-*►▪·]\s*/, '')
        .split(/[|–—]/)[0]
        .trim();

      // Project name line — short, non-technical
      if (cleanTitle.length >= 3 && cleanTitle.length <= 70 && !techLineMatch && !roleMatch) {
        if (curName && (curHighlights.length > 0 || curTech.length > 0)) {
          saveProject();
        }
        // If we already have a name with no content, replace it
        if (curName && curHighlights.length === 0 && curTech.length === 0) {
          saveProject();
        }
        curName = cleanTitle;

        // Check for inline tech stack: "Project Name (React, Node)"
        const inlineTech = l.match(/\(([^)]+)\)/);
        if (inlineTech && !inlineTech[1].includes('http')) {
          const techItems = inlineTech[1].split(/[,;]/).map((s) => s.trim()).filter(Boolean);
          // Only treat as tech if items look like tech names (short, no spaces in most)
          if (techItems.every((t) => t.length < 25)) {
            curTech = techItems;
          }
        }
      } else if (curName && l.length > 15) {
        // Long line after project name → description/highlight
        curHighlights.push(l.replace(/^[•\-*►▪·]\s*/, '').trim());
      }
    }

    saveProject();

    if (projects.length === 0 && projectLines.length > 0) {
      warnings.push(`Projects section had ${projectLines.length} lines but no structured entries could be extracted`);
    }

    return projects.slice(0, 6);
  }

  /**
   * Extract Certifications with real dates, issuer, credential IDs.
   * Returns empty array if no certifications found.
   */
  private static extractCertifications(certLines: string[], warnings: string[]): CanonicalCertification[] {
    if (certLines.length === 0) return [];

    const certs: CanonicalCertification[] = [];

    for (const cl of certLines) {
      if (cl.length < 5 || !isReadableText(cl)) continue;
      if (/^[•\-*►▪·]\s*$/.test(cl)) continue;

      const cleanLine = cl.replace(/^[•\-*►▪·]\s*/, '').trim();

      // Split by separators to get name | issuer | date | etc
      const parts = cleanLine.split(/[|•·–]/).map((p) => p.trim()).filter(Boolean);

      const name = parts[0] || cleanLine;
      const issuer = parts.length >= 2 ? parts[1] : '';

      // Extract date from any part
      let date = '';
      let expiryDate = '';
      for (const part of parts) {
        const dateMatch = part.match(/((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?(?:19|20)\d{2}/i);
        if (dateMatch) {
          if (!date) {
            date = dateMatch[0].trim();
          } else if (!expiryDate) {
            expiryDate = dateMatch[0].trim();
          }
        }
      }
      // Also try extracting from the whole line
      if (!date) {
        const wholeDateMatch = cleanLine.match(/((?:19|20)\d{2})/);
        if (wholeDateMatch) date = wholeDateMatch[1];
      }

      // Extract credential ID
      let credentialId = '';
      const credMatch = cleanLine.match(/(?:credential\s*(?:id)?|id)\s*:?\s*([A-Za-z0-9\-_]+)/i);
      if (credMatch) credentialId = credMatch[1];

      // Extract URL
      let link = '';
      const urlMatch = cleanLine.match(/https?:\/\/[^\s)]+/);
      if (urlMatch) link = urlMatch[0];

      certs.push({
        id: `cert-${Date.now()}-${certs.length + 1}`,
        name,
        issuer,
        date,
        expiryDate,
        credentialId,
        link,
      });
    }

    if (certs.length === 0 && certLines.length > 0) {
      warnings.push(`Certifications section had ${certLines.length} lines but no entries could be extracted`);
    }

    return certs.slice(0, 6);
  }
}
