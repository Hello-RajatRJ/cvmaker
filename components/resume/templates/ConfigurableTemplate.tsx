'use client';

import React from 'react';
import { ResumeData, TemplateConfig, SectionKey } from '../../../types/resume';
import { Globe, Mail, Phone, MapPin, Linkedin, Github } from 'lucide-react';
import { formatDate, formatDateRange } from '../../../utils/formatDate';

interface ConfigurableTemplateProps {
  resume: ResumeData;
  config: TemplateConfig;
}

export default function ConfigurableTemplate({ resume, config }: ConfigurableTemplateProps) {
  const accent = config.defaultAccent || '#1e3a5f';

  // Always use Calibri font across all templates
  const fontClass = 'font-sans';

  const sectionOrder: SectionKey[] = resume.sectionOrder || ['summary', 'experience', 'education', 'projects', 'skills', 'certifications', 'languages', 'awards', 'publications', 'volunteer'];

  const visibleSections = resume.visibleSections || {
    summary: true, experience: true, education: true, projects: true, skills: true, certifications: true,
    languages: false, awards: false, publications: false, volunteer: false,
  };

  // Section heading helper
  const sectionHeading = (title: string) => (
    <h2
      className="text-xs font-bold uppercase tracking-wider mb-3 pb-1 border-b"
      style={{ color: accent, borderColor: `${accent}40` }}
    >
      {title}
    </h2>
  );

  const renderSection = (key: SectionKey) => {
    // Check visibility
    if (visibleSections[key] === false) return null;

    switch (key) {
      case 'summary':
        return resume.contact.summary ? (
          <div key="summary" className="mb-4">
            {sectionHeading('Professional Summary')}
            <p className="text-slate-700 leading-relaxed text-justify">{resume.contact.summary}</p>
          </div>
        ) : null;

      case 'experience':
        return resume.experience.length > 0 ? (
          <div key="experience" className="mb-6">
            {sectionHeading('Work Experience')}
            <div className="space-y-4">
              {resume.experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-extrabold text-slate-900 text-xs">{exp.position}</h3>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700 font-medium text-[11px] mb-1.5">
                    <span>
                      {exp.company}
                      {exp.employmentType ? ` · ${exp.employmentType}` : ''}
                    </span>
                    <span>{exp.location}</span>
                  </div>
                  {exp.description && (
                    <p className="text-slate-600 text-[11px] leading-relaxed mb-1">{exp.description}</p>
                  )}
                  <ul className="space-y-1 text-slate-700 leading-relaxed mt-1.5">
                    {exp.highlights.filter(h => h.trim()).map((bullet, idx) => (
                      <li key={idx} className="flex items-start text-justify">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-700 mt-1.5 mr-2 shrink-0" />
                        <span className="flex-1">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  {exp.technologies && exp.technologies.length > 0 && (
                    <p className="text-[10px] text-slate-500 mt-1 font-mono">
                      Technologies: {exp.technologies.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null;

      case 'education':
        return resume.education.length > 0 ? (
          <div key="education" className="mb-6">
            {sectionHeading('Education')}
            <div className="space-y-3">
              {resume.education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex justify-between items-baseline">
                    <div>
                      <h3 className="font-extrabold text-slate-900">{edu.institution}</h3>
                      <p className="text-slate-700 text-[11px]">
                        {edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}
                        {edu.gpa ? ` · GPA: ${edu.gpa}` : ''}
                      </p>
                      {edu.location && (
                        <p className="text-slate-500 text-[10px]">{edu.location}{edu.studyMode ? ` · ${edu.studyMode}` : ''}</p>
                      )}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 whitespace-nowrap ml-2">
                      {formatDateRange(edu.startDate, edu.endDate, edu.current)}
                    </span>
                  </div>
                  {edu.coursework && edu.coursework.length > 0 && (
                    <p className="text-[10px] text-slate-600 mt-0.5">Coursework: {edu.coursework.join(', ')}</p>
                  )}
                  {edu.academicAchievements && edu.academicAchievements.length > 0 && (
                    <p className="text-[10px] text-slate-600 mt-0.5">Achievements: {edu.academicAchievements.join(', ')}</p>
                  )}
                  {edu.description && (
                    <p className="text-[10px] text-slate-600 mt-0.5">{edu.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null;

      case 'projects':
        return resume.projects.length > 0 ? (
          <div key="projects" className="mb-6">
            {sectionHeading('Key Technical Projects')}
            <div className="space-y-4">
              {resume.projects.map((proj) => (
                <div key={proj.id} className="space-y-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="flex items-baseline space-x-2">
                      <h3 className="font-extrabold text-slate-900 text-xs">{proj.name}</h3>
                      {proj.role && (
                        <span className="text-[11px] font-semibold text-slate-600">
                          • {proj.role}
                        </span>
                      )}
                    </div>
                    {(proj.startDate || proj.endDate) && (
                      <span className="text-[10px] font-semibold text-slate-500">
                        {formatDate(proj.startDate)} {proj.endDate ? `– ${formatDate(proj.endDate)}` : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[10px]">
                    {proj.link && (
                      <a href={proj.link} target="_blank" rel="noreferrer" className="text-blue-700 font-semibold underline">
                        🔗 Live Demo
                      </a>
                    )}
                    {proj.repoLink && (
                      <a href={proj.repoLink} target="_blank" rel="noreferrer" className="text-slate-700 font-semibold underline">
                        💻 GitHub Repo
                      </a>
                    )}
                    {proj.technologies && proj.technologies.length > 0 && (
                      <span className="font-mono text-slate-600">
                        Stack: [{proj.technologies.join(', ')}]
                      </span>
                    )}
                  </div>
                  {proj.description && (
                    <p className="text-slate-700 text-[11px] leading-relaxed pt-0.5">{proj.description}</p>
                  )}
                  {proj.highlights && proj.highlights.filter(h => h.trim()).length > 0 && (
                    <ul className="space-y-1 text-slate-700 text-[11px] leading-relaxed pt-1">
                      {proj.highlights.filter(h => h.trim()).map((bullet, idx) => (
                        <li key={idx} className="flex items-start text-justify">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-700 mt-1.5 mr-2 shrink-0" />
                          <span className="flex-1">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null;

      case 'skills':
        return resume.skills.length > 0 ? (
          <div key="skills" className="mb-6">
            {sectionHeading('Skills & Technologies')}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {resume.skills.map((cat) => (
                <div key={cat.id}>
                  <p className="font-bold text-slate-900">{cat.category}</p>
                  <p className="text-slate-700 mt-0.5">{cat.skills.join(', ')}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null;

      case 'certifications':
        return resume.certifications && resume.certifications.length > 0 ? (
          <div key="certifications" className="mb-6">
            {sectionHeading('Certifications & Credentials')}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {resume.certifications.map((cert) => (
                <div key={cert.id} className="p-2.5 rounded-lg border border-slate-200/80 bg-slate-50/50">
                  <p className="font-extrabold text-slate-900 text-xs">{cert.name}</p>
                  <p className="text-[11px] font-semibold text-slate-600 mt-0.5">
                    {cert.issuer}{cert.date ? ` • Issued ${formatDate(cert.date)}` : ''}
                  </p>
                  {cert.credentialId && (
                    <p className="text-[10px] text-slate-500 mt-0.5">ID: {cert.credentialId}</p>
                  )}
                  {cert.expiryDate && !cert.neverExpires && (
                    <p className="text-[10px] text-slate-500">Expires: {formatDate(cert.expiryDate)}</p>
                  )}
                  {cert.neverExpires && (
                    <p className="text-[10px] text-slate-500">No expiration</p>
                  )}
                  {cert.link && (
                    <a href={cert.link} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 underline">Verify credential</a>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null;

      case 'languages':
        return resume.languages && resume.languages.length > 0 ? (
          <div key="languages" className="mb-6">
            {sectionHeading('Languages')}
            <div className="flex flex-wrap gap-4">
              {resume.languages.map((lang) => (
                <div key={lang.id} className="text-[11px]">
                  <span className="font-bold text-slate-900">{lang.name}</span>
                  <span className="text-slate-600 ml-1">({lang.proficiency})</span>
                  {lang.certification && <span className="text-slate-500 ml-1">– {lang.certification}</span>}
                </div>
              ))}
            </div>
          </div>
        ) : null;

      case 'awards':
        return resume.awards && resume.awards.length > 0 ? (
          <div key="awards" className="mb-6">
            {sectionHeading('Awards & Achievements')}
            <div className="space-y-2">
              {resume.awards.map((award) => (
                <div key={award.id}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-slate-900 text-xs">{award.title}</h3>
                    {award.date && <span className="text-[10px] font-semibold text-slate-500">{formatDate(award.date)}</span>}
                  </div>
                  <p className="text-[11px] text-slate-600">{award.issuer}</p>
                  {award.description && <p className="text-[10px] text-slate-600 mt-0.5">{award.description}</p>}
                </div>
              ))}
            </div>
          </div>
        ) : null;

      case 'publications':
        return resume.publications && resume.publications.length > 0 ? (
          <div key="publications" className="mb-6">
            {sectionHeading('Publications')}
            <div className="space-y-2">
              {resume.publications.map((pub) => (
                <div key={pub.id}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-slate-900 text-xs">{pub.title}</h3>
                    {pub.date && <span className="text-[10px] font-semibold text-slate-500">{formatDate(pub.date)}</span>}
                  </div>
                  <p className="text-[11px] text-slate-600">{pub.publisher}</p>
                  {pub.url && <a href={pub.url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 underline">{pub.url}</a>}
                  {pub.description && <p className="text-[10px] text-slate-600 mt-0.5">{pub.description}</p>}
                </div>
              ))}
            </div>
          </div>
        ) : null;

      case 'volunteer':
        return resume.volunteer && resume.volunteer.length > 0 ? (
          <div key="volunteer" className="mb-6">
            {sectionHeading('Volunteer Experience')}
            <div className="space-y-3">
              {resume.volunteer.map((vol) => (
                <div key={vol.id}>
                  <div className="flex justify-between items-baseline">
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs">{vol.role}</h3>
                      <p className="text-[11px] text-slate-600">{vol.organization}</p>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {formatDateRange(vol.startDate, vol.endDate, vol.current)}
                    </span>
                  </div>
                  {vol.description && <p className="text-[10px] text-slate-600 mt-0.5">{vol.description}</p>}
                  {vol.highlights && vol.highlights.filter(h => h.trim()).length > 0 && (
                    <ul className="space-y-1 text-slate-700 text-[10px] leading-relaxed mt-1">
                      {vol.highlights.filter(h => h.trim()).map((h, i) => (
                        <li key={i} className="flex items-start">
                          <span className="inline-block w-1 h-1 rounded-full bg-slate-600 mt-1.5 mr-2 shrink-0" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div
      id="resume-preview-container"
      className={`resume-paper w-full min-h-[1050px] bg-white text-slate-900 shadow-2xl p-8 sm:p-10 ${fontClass} text-xs transition-all relative overflow-hidden`}
      style={{ backgroundColor: config.bodyBg || '#ffffff', fontFamily: "'Calibri', 'Carlito', 'Segoe UI', sans-serif" }}
    >
      {/* Dynamic Header Style */}
      {config.headerStyle === 'banner' ? (
        <div
          className="-mx-8 -mt-8 sm:-mx-10 sm:-mt-10 p-8 mb-4 text-white"
          style={{ backgroundColor: accent }}
        >
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
            {resume.contact.fullName}
          </h1>
          <p className="text-sm font-semibold opacity-90 mt-1">{resume.contact.jobTitle}</p>
          <div className="flex flex-wrap gap-4 text-[11px] opacity-80 mt-2.5">
            {resume.contact.email && <span>📧 {resume.contact.email}</span>}
            {resume.contact.phone && <span>📞 {resume.contact.phone}</span>}
            {resume.contact.location && <span>📍 {resume.contact.location}</span>}
            {resume.contact.website && <span>🌐 {resume.contact.website}</span>}
            {resume.contact.linkedin && <span>🔗 {resume.contact.linkedin}</span>}
            {resume.contact.github && <span>💻 {resume.contact.github}</span>}
          </div>
        </div>
      ) : (
        <div className={`mb-3 pb-2.5 border-b border-slate-200/80 ${config.headerStyle === 'centered' ? 'text-center' : 'text-left'}`}>
          <h1
            className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight"
            style={{ color: accent }}
          >
            {resume.contact.fullName}
          </h1>
          <p className="text-sm font-bold text-slate-700 mt-0.5">{resume.contact.jobTitle}</p>
          <div
            className={`flex flex-wrap gap-2.5 text-[11px] text-slate-600 mt-1.5 ${config.headerStyle === 'centered' ? 'justify-center' : 'justify-start'
              }`}
          >
            {resume.contact.email && <span>{resume.contact.email}</span>}
            {resume.contact.phone && <span>• {resume.contact.phone}</span>}
            {resume.contact.location && <span>• {resume.contact.location}</span>}
            {resume.contact.website && <span>• {resume.contact.website}</span>}
            {resume.contact.linkedin && <span>• {resume.contact.linkedin}</span>}
            {resume.contact.github && <span>• {resume.contact.github}</span>}
          </div>
        </div>
      )}

      {/* Main Content Layout - Dynamic Ordering */}
      <div className={config.layout === 'sidebar-left' ? 'grid grid-cols-3 gap-6' : 'space-y-4'}>
        {config.layout === 'sidebar-left' ? (
          <>
            <div className="col-span-1 space-y-4 pr-4 border-r border-slate-200">
              {sectionOrder
                .filter((k) => k === 'skills' || k === 'certifications' || k === 'education' || k === 'languages')
                .map((k) => renderSection(k))}
            </div>
            <div className="col-span-2 space-y-4">
              {sectionOrder
                .filter((k) => k === 'summary' || k === 'experience' || k === 'projects' || k === 'awards' || k === 'publications' || k === 'volunteer')
                .map((k) => renderSection(k))}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {sectionOrder.map((k) => renderSection(k))}
          </div>
        )}
      </div>
    </div>
  );
}
