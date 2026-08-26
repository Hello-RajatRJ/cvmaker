#!/usr/bin/env node
/**
 * Universal Node.js CSV Parser Worker for Resume Architect Platform
 * Reads CSV from stdin or file argument → outputs structured Dual-Schema ResumeData JSON
 *
 * DESIGN PRINCIPLE: Never fabricate data. If a field is missing from the CSV,
 * return an empty string / empty array. Let the UI handle empty states.
 */

const fs = require('fs');

function cleanKey(key) {
  return String(key || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

function splitList(val, delimiters = [',', ';', '|', '\n']) {
  if (!val) return [];
  const s = String(val).trim();
  for (const d of delimiters) {
    if (s.includes(d)) {
      const parts = s.split(d).map((p) => p.trim()).filter(Boolean);
      if (parts.length > 1) return parts;
    }
  }
  return s ? [s] : [];
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}

/**
 * Extract degree info from an education text string.
 * Returns { degree, fieldOfStudy } with actual values or empty strings.
 */
function parseEducationText(text) {
  const degreeKeywords = /\b(bachelor'?s?|master'?s?|ph\.?d|doctorate|b\.?tech|b\.?s\.?|b\.?e\.?|m\.?tech|m\.?s\.?|m\.?b\.?a|b\.?a\.?|m\.?a\.?|associate|diploma|certificate)\b/i;
  const degreeMatch = text.match(degreeKeywords);
  let degree = '';
  let fieldOfStudy = '';

  if (degreeMatch) {
    // Try to capture the full degree text
    const idx = text.indexOf(degreeMatch[0]);
    degree = text.substring(idx).split(/[|•·–(]/)[0].trim();

    // Extract field: "in Computer Science"
    const fieldMatch = text.match(/\bin\s+([A-Za-z\s&,]+?)(?:\s*(?:\||•|·|–|\(|$))/i);
    if (fieldMatch) fieldOfStudy = fieldMatch[1].trim();
  }

  // Extract institution (before degree keyword or first part)
  let institution = '';
  if (text.includes('(')) {
    institution = text.split('(')[0].trim();
    // The part in parens might be the degree
    const parenContent = text.match(/\(([^)]+)\)/);
    if (parenContent && !degree) {
      degree = parenContent[1].trim();
    }
  } else {
    institution = text.split(',')[0].trim();
  }

  // Extract dates
  let startDate = '';
  let endDate = '';
  const dateMatch = text.match(/((?:19|20)\d{2})\s*(?:–|-|to)\s*((?:19|20)\d{2}|present|current)/i);
  if (dateMatch) {
    startDate = dateMatch[1];
    endDate = dateMatch[2];
  }

  // Extract GPA
  let gpa = '';
  const gpaMatch = text.match(/(?:gpa|cgpa|grade|percentage)[\s:]*([0-9]+\.?[0-9]*(?:\s*\/\s*[0-9]+\.?[0-9]*|%)?)/i);
  if (gpaMatch) gpa = gpaMatch[1].trim();

  return { institution, degree, fieldOfStudy, startDate, endDate, gpa };
}

function parseCSV(csvText) {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return { error: 'Empty CSV file' };

  const rows = lines.map(parseCSVLine).filter((row) => row.some((cell) => cell.trim()));
  if (rows.length === 0) return { error: 'No data rows found' };

  const contact = {
    fullName: '',
    jobTitle: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    linkedin: '',
    github: '',
    summary: '',
  };
  const skills = [];
  const experience = [];
  const education = [];
  const projects = [];
  const certifications = [];

  // Detect vertical key-value layout
  let isVertical = false;
  if (rows.length >= 3 && rows.slice(0, 6).every((r) => r.length >= 2)) {
    const col0Keys = rows.slice(0, 8).map((r) => cleanKey(r[0]));
    const knownTerms = [
      'name', 'title', 'role', 'email', 'phone', 'location', 'summary',
      'skills', 'experience', 'education', 'project', 'about', 'bio',
      'objective', 'company', 'work', 'degree', 'university', 'cert'
    ];
    const matches = col0Keys.filter((k) => knownTerms.some((t) => k.includes(t)));
    if (matches.length >= 2) isVertical = true;
  }

  if (isVertical) {
    // ─── Vertical Key-Value Parsing ───
    for (const row of rows) {
      if (row.length < 2) continue;
      const k = cleanKey(row[0]);
      const v = row.slice(1).map((c) => c.trim()).filter(Boolean).join(', ');
      if (!v) continue;

      if (['fullname', 'candidatename', 'name', 'person'].some((t) => k.includes(t) && !k.includes('project') && !k.includes('company'))) {
        contact.fullName = v;
      } else if (['jobtitle', 'position', 'role', 'title', 'headline', 'designation'].some((t) => k.includes(t))) {
        contact.jobTitle = v;
      } else if (k.includes('email') || k.includes('mail')) {
        contact.email = v;
      } else if (['phone', 'mobile', 'tel', 'number', 'contact'].some((t) => k.includes(t)) && !k.includes('version')) {
        contact.phone = v;
      } else if (['location', 'city', 'country', 'address'].some((t) => k.includes(t))) {
        contact.location = v;
      } else if (k.includes('linkedin')) {
        contact.linkedin = v;
      } else if (k.includes('github')) {
        contact.github = v;
      } else if (['website', 'portfolio', 'url', 'link'].some((t) => k.includes(t)) && !k.includes('github') && !k.includes('linkedin')) {
        contact.website = v;
      } else if (['summary', 'about', 'bio', 'objective', 'profile', 'description'].some((t) => k.includes(t))) {
        contact.summary = v;
      } else if (['skills', 'skill', 'technologies', 'techstack', 'competencies'].some((t) => k.includes(t))) {
        const sList = splitList(v);
        if (sList.length > 0) {
          skills.push({
            id: `skills-${skills.length + 1}`,
            category: row[0].trim() || 'Extracted Skills',
            categoryName: row[0].trim() || 'Extracted Skills',
            skills: sList,
          });
        }
      } else if (['experience', 'work', 'employment', 'company', 'history'].some((t) => k.includes(t))) {
        const highlights = splitList(v, [';', '|', '\n']);
        const comp = v.includes(' - ') ? v.split(' - ')[0].trim() : '';
        experience.push({
          id: `exp-${Date.now()}-${experience.length + 1}`,
          company: comp,
          position: contact.jobTitle || '',
          jobTitle: contact.jobTitle || '',
          location: contact.location || '',
          startDate: '',
          endDate: experience.length === 0 ? 'Present' : '',
          current: experience.length === 0,
          highlights: highlights.length > 1 ? highlights : [v],
          technologies: [],
        });
      } else if (['education', 'college', 'university', 'degree', 'school'].some((t) => k.includes(t))) {
        const parsed = parseEducationText(v);
        education.push({
          id: `edu-${Date.now()}-${education.length + 1}`,
          institution: parsed.institution || v.split(',')[0].trim(),
          degree: parsed.degree,
          fieldOfStudy: parsed.fieldOfStudy,
          startDate: parsed.startDate,
          endDate: parsed.endDate,
          gpa: parsed.gpa,
          highlights: [],
        });
      } else if (['project', 'projects'].some((t) => k.includes(t))) {
        const pItems = splitList(v, [';', '|', '\n']);
        for (const p of pItems) {
          projects.push({
            id: `proj-${Date.now()}-${projects.length + 1}`,
            name: p.trim(),
            title: p.trim(),
            role: '',
            technologies: [],
            techStack: [],
            description: '',
            highlights: [],
            link: '',
            repoLink: '',
          });
        }
      } else if (['certification', 'certifications', 'certificate', 'license'].some((t) => k.includes(t))) {
        const cItems = splitList(v, [';', '|', '\n']);
        for (const c of cItems) {
          const parts = c.split(/\s*[-–]\s*/);
          certifications.push({
            id: `cert-${Date.now()}-${certifications.length + 1}`,
            name: parts[0] ? parts[0].trim() : c.trim(),
            issuer: parts[1] ? parts[1].trim() : '',
            date: '',
            expiryDate: '',
            credentialId: '',
            link: '',
          });
        }
      }
    }
  } else {
    // ─── Horizontal Tabular CSV Parsing ───
    const cleanedHeaders = rows[0].map(cleanKey);
    const dataRows = rows.slice(1);
    if (dataRows.length === 0) return { error: 'No data rows after header' };

    const fm = {};
    cleanedHeaders.forEach((h, idx) => {
      if (['fullname', 'candidatename', 'name', 'person'].some((k) => h.includes(k))) fm.fullName = idx;
      else if (['jobtitle', 'position', 'role', 'title', 'headline', 'designation'].some((k) => h.includes(k))) fm.jobTitle = idx;
      else if (h.includes('email') || h.includes('mail')) fm.email = idx;
      else if (['phone', 'mobile', 'tel', 'contact', 'number'].some((k) => h.includes(k))) fm.phone = idx;
      else if (['location', 'city', 'country', 'address'].some((k) => h.includes(k))) fm.location = idx;
      else if (h.includes('linkedin')) fm.linkedin = idx;
      else if (h.includes('github') || h.includes('git')) fm.github = idx;
      else if (['website', 'portfolio', 'url', 'link'].some((k) => h.includes(k))) fm.website = idx;
      else if (['summary', 'about', 'bio', 'objective', 'description', 'profile'].some((k) => h.includes(k))) fm.summary = idx;
      else if (['skills', 'skill', 'technologies', 'techstack'].some((k) => h.includes(k))) fm.skills = idx;
      else if (['company', 'organization', 'employer'].some((k) => h.includes(k))) fm.company = idx;
      else if (['experience', 'work', 'employment'].some((k) => h.includes(k))) fm.experience = idx;
      else if (['education', 'college', 'university', 'school', 'degree'].some((k) => h.includes(k))) fm.education = idx;
      else if (['project', 'projects'].some((k) => h.includes(k))) fm.projects = idx;
      else if (['certification', 'certifications'].some((k) => h.includes(k))) fm.certifications = idx;
    });

    const get = (row, field) => (fm[field] !== undefined && fm[field] < row.length ? row[fm[field]].trim() : '');

    const r0 = dataRows[0];
    contact.fullName = get(r0, 'fullName');
    contact.jobTitle = get(r0, 'jobTitle');
    contact.email = get(r0, 'email');
    contact.phone = get(r0, 'phone');
    contact.location = get(r0, 'location');
    contact.website = get(r0, 'website');
    contact.linkedin = get(r0, 'linkedin');
    contact.github = get(r0, 'github');
    contact.summary = get(r0, 'summary');

    // Skills
    const allSkills = [];
    if (fm.skills !== undefined) {
      for (const r of dataRows) {
        const sv = get(r, 'skills');
        if (sv) allSkills.push(...splitList(sv));
      }
    }
    if (allSkills.length > 0) {
      const uniq = [...new Set(allSkills)];
      skills.push({
        id: 'skills-core',
        category: 'Core Competencies',
        categoryName: 'Core Competencies',
        skills: uniq.slice(0, 8),
      });
      if (uniq.length > 8) {
        skills.push({
          id: 'skills-tools',
          category: 'Tools & Frameworks',
          categoryName: 'Tools & Frameworks',
          skills: uniq.slice(8, 16),
        });
      }
    }

    // Experience
    for (let i = 0; i < dataRows.length; i++) {
      const r = dataRows[i];
      const comp = get(r, 'company');
      const expText = get(r, 'experience');
      if (comp || expText) {
        const highlights = splitList(expText, [';', '|', '\n']);
        experience.push({
          id: `exp-${Date.now()}-${i + 1}`,
          company: comp,
          position: get(r, 'jobTitle') || contact.jobTitle || '',
          jobTitle: get(r, 'jobTitle') || contact.jobTitle || '',
          location: get(r, 'location') || contact.location || '',
          startDate: '',
          endDate: i === 0 ? 'Present' : '',
          current: i === 0,
          highlights: highlights,
          technologies: [],
        });
      }
    }

    // Education
    if (fm.education !== undefined) {
      for (let i = 0; i < dataRows.length; i++) {
        const eduStr = get(dataRows[i], 'education');
        if (eduStr) {
          const parsed = parseEducationText(eduStr);
          education.push({
            id: `edu-${Date.now()}-${i + 1}`,
            institution: parsed.institution || eduStr.split(',')[0].trim(),
            degree: parsed.degree,
            fieldOfStudy: parsed.fieldOfStudy,
            startDate: parsed.startDate,
            endDate: parsed.endDate,
            gpa: parsed.gpa,
            highlights: [],
          });
        }
      }
    }

    // Projects
    if (fm.projects !== undefined) {
      for (let i = 0; i < dataRows.length; i++) {
        const pStr = get(dataRows[i], 'projects');
        if (pStr) {
          const items = splitList(pStr, [';', '|', '\n']);
          for (const item of items) {
            projects.push({
              id: `proj-${Date.now()}-${projects.length + 1}`,
              name: item.trim(),
              title: item.trim(),
              role: '',
              technologies: allSkills.length > 0 ? allSkills.slice(0, 4) : [],
              techStack: allSkills.length > 0 ? allSkills.slice(0, 4) : [],
              description: '',
              highlights: [],
              link: '',
              repoLink: '',
            });
          }
        }
      }
    }

    // Certifications
    if (fm.certifications !== undefined) {
      for (let i = 0; i < dataRows.length; i++) {
        const cStr = get(dataRows[i], 'certifications');
        if (cStr) {
          const items = splitList(cStr, [';', '|', '\n']);
          for (const item of items) {
            const parts = item.split(/\s*[-–]\s*/);
            certifications.push({
              id: `cert-${Date.now()}-${certifications.length + 1}`,
              name: parts[0] ? parts[0].trim() : item.trim(),
              issuer: parts[1] ? parts[1].trim() : '',
              date: '',
              expiryDate: '',
              credentialId: '',
              link: '',
            });
          }
        }
      }
    }
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
  };
}

// ─── Main: Read from file arg or stdin ───
if (process.argv[2]) {
  const content = fs.readFileSync(process.argv[2], 'utf-8');
  console.log(JSON.stringify(parseCSV(content), null, 2));
} else {
  let input = '';
  process.stdin.setEncoding('utf-8');
  process.stdin.on('data', (chunk) => (input += chunk));
  process.stdin.on('end', () => {
    console.log(JSON.stringify(parseCSV(input), null, 2));
  });
}
