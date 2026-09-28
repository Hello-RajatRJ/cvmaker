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

  // Font family resolution
  const getFontFamily = () => {
    switch (config.fontProfile) {
      case 'serif':
        return "'Georgia', 'Cambria', 'Times New Roman', serif";
      case 'mono':
        return "'Consolas', 'Menlo', 'Monaco', 'Courier New', monospace";
      case 'mixed':
        return "'Calibri', 'Inter', 'Segoe UI', sans-serif";
      case 'sans':
      default:
        return "'Calibri', 'Inter', 'Segoe UI', system-ui, sans-serif";
    }
  };

  const getHeadingFont = () => {
    if (config.fontProfile === 'serif' || config.fontProfile === 'mixed') {
      return "'Georgia', 'Cambria', serif";
    }
    if (config.fontProfile === 'mono') {
      return "'Consolas', 'Menlo', monospace";
    }
    return "'Calibri', 'Inter', sans-serif";
  };

  const sectionOrder: SectionKey[] = resume.sectionOrder || [
    'summary',
    'experience',
    'education',
    'projects',
    'skills',
    'certifications',
    'languages',
    'awards',
    'publications',
    'volunteer'
  ];

  const visibleSections = resume.visibleSections || {
    summary: true,
    experience: true,
    education: true,
    projects: true,
    skills: true,
    certifications: true,
    languages: false,
    awards: false,
    publications: false,
    volunteer: false,
  };

  // Dynamic Section Heading Helper based on sectionDivider
  const renderSectionHeading = (title: string) => {
    const headingStyle = {
      color: accent,
      fontFamily: getHeadingFont(),
    };

    switch (config.sectionDivider) {
      case 'accent-bar':
        return (
          <div className="flex items-center space-x-2 mb-3">
            <span className="w-1.5 h-4 rounded-sm shrink-0" style={{ backgroundColor: accent }} />
            <h2 className="text-xs font-black uppercase tracking-wider" style={headingStyle}>
              {title}
            </h2>
          </div>
        );

      case 'thick-underline':
        return (
          <h2
            className="text-xs font-black uppercase tracking-wider mb-3 pb-1"
            style={{ ...headingStyle, borderBottom: `2.5px solid ${accent}` }}
          >
            {title}
          </h2>
        );

      case 'double-line':
        return (
          <h2
            className="text-xs font-bold uppercase tracking-wider mb-3 pb-1"
            style={{ ...headingStyle, borderBottom: `3px double ${accent}80` }}
          >
            {title}
          </h2>
        );

      case 'dot':
        return (
          <h2
            className="text-xs font-bold uppercase tracking-wider mb-3 pb-1"
            style={{ ...headingStyle, borderBottom: `1.5px dotted ${accent}` }}
          >
            {title}
          </h2>
        );

      case 'none':
        return (
          <h2 className="text-xs font-black uppercase tracking-wider mb-2" style={headingStyle}>
            {title}
          </h2>
        );

      case 'line':
      default:
        return (
          <h2
            className="text-xs font-bold uppercase tracking-wider mb-3 pb-1 border-b"
            style={{ ...headingStyle, borderColor: `${accent}40` }}
          >
            {title}
          </h2>
        );
    }
  };

  // Spacing presets
  const spacingClass = config.spacing === 'compact' ? 'space-y-3 mb-3.5' : config.spacing === 'relaxed' ? 'space-y-5 mb-6' : 'space-y-4 mb-5';

  const renderSection = (key: SectionKey) => {
    if (visibleSections[key] === false) return null;

    switch (key) {
      case 'summary':
        return resume.contact.summary ? (
          <div key="summary" className={config.spacing === 'compact' ? 'mb-3' : 'mb-4'}>
            {renderSectionHeading('Professional Summary')}
            <p className="text-slate-700 leading-relaxed text-justify">{resume.contact.summary}</p>
          </div>
        ) : null;

      case 'experience':
        return resume.experience.length > 0 ? (
          <div key="experience" className={config.spacing === 'compact' ? 'mb-4' : 'mb-6'}>
            {renderSectionHeading('Work Experience')}
            <div className={config.spacing === 'compact' ? 'space-y-3' : 'space-y-4'}>
              {resume.experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-extrabold text-slate-900 text-xs">{exp.position}</h3>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700 font-medium text-[11px] mb-1">
                    <span>
                      {exp.company}
                      {exp.employmentType ? ` · ${exp.employmentType}` : ''}
                    </span>
                    <span>{exp.location}</span>
                  </div>
                  {exp.description && (
                    <p className="text-slate-600 text-[11px] leading-relaxed mb-1">{exp.description}</p>
                  )}
                  <ul className="space-y-1 text-slate-700 leading-relaxed mt-1">
                    {exp.highlights.filter(h => h.trim()).map((bullet, idx) => (
                      <li key={idx} className="flex items-start text-justify">
                        <span className="inline-block w-1.5 h-1.5 rounded-full mt-1.5 mr-2 shrink-0" style={{ backgroundColor: accent }} />
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
          <div key="education" className={config.spacing === 'compact' ? 'mb-4' : 'mb-6'}>
            {renderSectionHeading('Education')}
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
          <div key="projects" className={config.spacing === 'compact' ? 'mb-4' : 'mb-6'}>
            {renderSectionHeading('Key Projects')}
            {/* Dynamic Project Style */}
            {config.projectStyle === 'card' ? (
              <div className="space-y-3">
                {resume.projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-3 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-1.5"
                    style={{ borderLeft: `3.5px solid ${accent}` }}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="flex items-baseline space-x-2">
                        <h3 className="font-extrabold text-slate-900 text-xs">{proj.name}</h3>
                        {proj.role && <span className="text-[11px] font-semibold text-slate-600">• {proj.role}</span>}
                      </div>
                      {(proj.startDate || proj.endDate) && (
                        <span className="text-[10px] font-semibold text-slate-500">
                          {formatDate(proj.startDate)} {proj.endDate ? `– ${formatDate(proj.endDate)}` : ''}
                        </span>
                      )}
                    </div>
                    {proj.technologies && proj.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {proj.technologies.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.2 rounded text-[9px] font-semibold"
                            style={{ backgroundColor: `${accent}15`, color: accent }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    {proj.description && <p className="text-slate-700 text-[11px] leading-relaxed">{proj.description}</p>}
                    {proj.highlights && proj.highlights.filter(h => h.trim()).length > 0 && (
                      <ul className="space-y-0.5 text-slate-700 text-[10.5px] leading-relaxed">
                        {proj.highlights.filter(h => h.trim()).map((bullet, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="inline-block w-1.5 h-1.5 rounded-full mt-1.5 mr-2 shrink-0" style={{ backgroundColor: accent }} />
                            <span className="flex-1">{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            ) : config.projectStyle === 'timeline' ? (
              <div className="relative pl-3.5 space-y-3.5" style={{ borderLeft: `2px solid ${accent}40` }}>
                {resume.projects.map((proj) => (
                  <div key={proj.id} className="relative">
                    <span
                      className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white"
                      style={{ backgroundColor: accent }}
                    />
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-extrabold text-slate-900 text-xs">{proj.name}</h3>
                      {(proj.startDate || proj.endDate) && (
                        <span className="text-[10px] font-semibold text-slate-500">
                          {formatDate(proj.startDate)} {proj.endDate ? `– ${formatDate(proj.endDate)}` : ''}
                        </span>
                      )}
                    </div>
                    {proj.description && <p className="text-slate-700 text-[11px] leading-relaxed mt-0.5">{proj.description}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {resume.projects.map((proj) => (
                  <div key={proj.id} className="space-y-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="flex items-baseline space-x-2">
                        <h3 className="font-extrabold text-slate-900 text-xs">{proj.name}</h3>
                        {proj.role && <span className="text-[11px] font-semibold text-slate-600">• {proj.role}</span>}
                      </div>
                      {(proj.startDate || proj.endDate) && (
                        <span className="text-[10px] font-semibold text-slate-500">
                          {formatDate(proj.startDate)} {proj.endDate ? `– ${formatDate(proj.endDate)}` : ''}
                        </span>
                      )}
                    </div>
                    {proj.technologies && proj.technologies.length > 0 && (
                      <span className="font-mono text-slate-600 text-[10px] block">
                        Stack: [{proj.technologies.join(', ')}]
                      </span>
                    )}
                    {proj.description && <p className="text-slate-700 text-[11px] leading-relaxed">{proj.description}</p>}
                    {proj.highlights && proj.highlights.filter(h => h.trim()).length > 0 && (
                      <ul className="space-y-0.5 text-slate-700 text-[11px] leading-relaxed">
                        {proj.highlights.filter(h => h.trim()).map((bullet, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-700 mt-1.5 mr-2 shrink-0" />
                            <span className="flex-1">{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null;

      case 'skills':
        return resume.skills.length > 0 ? (
          <div key="skills" className={config.spacing === 'compact' ? 'mb-4' : 'mb-6'}>
            {renderSectionHeading('Skills & Technologies')}
            {/* Dynamic Skills Display */}
            {config.skillsDisplay === 'badges' ? (
              <div className="space-y-2.5">
                {resume.skills.map((cat) => (
                  <div key={cat.id}>
                    <p className="font-bold text-slate-800 text-[11px] mb-1">{cat.category}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.skills.map((sk, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
                          style={{
                            backgroundColor: `${accent}14`,
                            color: accent,
                            border: `1px solid ${accent}30`
                          }}
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : config.skillsDisplay === 'tags' ? (
              <div className="space-y-2.5">
                {resume.skills.map((cat) => (
                  <div key={cat.id}>
                    <p className="font-mono font-bold text-slate-800 text-[11px] mb-1">{cat.category}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.skills.map((sk, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-[10px] text-slate-800 font-medium"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : config.skillsDisplay === 'bars' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {resume.skills.map((cat) => (
                  <div key={cat.id} className="p-2 rounded-lg bg-slate-50/80 border border-slate-200">
                    <p className="font-bold text-slate-900 text-[11px] mb-1">{cat.category}</p>
                    <p className="text-[10px] text-slate-600 mb-1.5">{cat.skills.join(', ')}</p>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ backgroundColor: accent, width: '92%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : config.skillsDisplay === 'columns' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {resume.skills.map((cat) => (
                  <div key={cat.id}>
                    <p className="font-bold text-slate-900 text-xs mb-1">{cat.category}</p>
                    <ul className="text-slate-700 text-[11px] space-y-0.5">
                      {cat.skills.map((sk, idx) => (
                        <li key={idx} className="flex items-center">
                          <span className="w-1 h-1 rounded-full mr-1.5 shrink-0" style={{ backgroundColor: accent }} />
                          <span>{sk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {resume.skills.map((cat) => (
                  <div key={cat.id}>
                    <p className="font-bold text-slate-900">{cat.category}</p>
                    <p className="text-slate-700 mt-0.5">{cat.skills.join(', ')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null;

      case 'certifications':
        return resume.certifications && resume.certifications.length > 0 ? (
          <div key="certifications" className={config.spacing === 'compact' ? 'mb-4' : 'mb-6'}>
            {renderSectionHeading('Certifications')}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {resume.certifications.map((cert) => (
                <div key={cert.id} className="p-2 rounded-lg border border-slate-200/80 bg-slate-50/50">
                  <p className="font-extrabold text-slate-900 text-xs">{cert.name}</p>
                  <p className="text-[10.5px] font-semibold text-slate-600 mt-0.5">
                    {cert.issuer}{cert.date ? ` • ${formatDate(cert.date)}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null;

      case 'languages':
        return resume.languages && resume.languages.length > 0 ? (
          <div key="languages" className={config.spacing === 'compact' ? 'mb-4' : 'mb-6'}>
            {renderSectionHeading('Languages')}
            <div className="flex flex-wrap gap-3">
              {resume.languages.map((lang) => (
                <div key={lang.id} className="text-[11px]">
                  <span className="font-bold text-slate-900">{lang.name}</span>
                  <span className="text-slate-600 ml-1">({lang.proficiency})</span>
                </div>
              ))}
            </div>
          </div>
        ) : null;

      case 'awards':
        return resume.awards && resume.awards.length > 0 ? (
          <div key="awards" className={config.spacing === 'compact' ? 'mb-4' : 'mb-6'}>
            {renderSectionHeading('Awards')}
            <div className="space-y-2">
              {resume.awards.map((award) => (
                <div key={award.id}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-slate-900 text-xs">{award.title}</h3>
                    {award.date && <span className="text-[10px] font-semibold text-slate-500">{formatDate(award.date)}</span>}
                  </div>
                  <p className="text-[11px] text-slate-600">{award.issuer}</p>
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
      className="resume-paper w-full min-h-[1050px] bg-white text-slate-900 shadow-2xl p-8 sm:p-10 text-xs transition-all relative overflow-hidden"
      style={{
        backgroundColor: config.bodyBg || '#ffffff',
        fontFamily: getFontFamily(),
      }}
    >
      {/* ── Dynamic Header Styles ── */}
      {config.headerStyle === 'banner' ? (
        <div
          className="-mx-8 -mt-8 sm:-mx-10 sm:-mt-10 p-8 mb-6"
          style={{
            backgroundColor: config.headerBg || accent,
            color: config.headerTextColor || '#ffffff',
          }}
        >
          <h1
            className="text-2xl sm:text-3xl font-black uppercase tracking-tight"
            style={{ fontFamily: getHeadingFont() }}
          >
            {resume.contact.fullName}
          </h1>
          <p className="text-sm font-semibold opacity-90 mt-1">{resume.contact.jobTitle}</p>
          <div className="flex flex-wrap gap-4 text-[11px] opacity-85 mt-2.5">
            {resume.contact.email && <span>📧 {resume.contact.email}</span>}
            {resume.contact.phone && <span>📞 {resume.contact.phone}</span>}
            {resume.contact.location && <span>📍 {resume.contact.location}</span>}
            {resume.contact.website && <span>🌐 {resume.contact.website}</span>}
            {resume.contact.linkedin && <span>🔗 {resume.contact.linkedin}</span>}
            {resume.contact.github && <span>💻 {resume.contact.github}</span>}
          </div>
        </div>
      ) : config.headerStyle === 'split' ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3.5 mb-5 border-b border-slate-200/80 gap-3">
          <div>
            <h1
              className="text-2xl sm:text-3xl font-black uppercase tracking-tight"
              style={{ color: accent, fontFamily: getHeadingFont() }}
            >
              {resume.contact.fullName}
            </h1>
            <p className="text-sm font-bold text-slate-700 mt-0.5">{resume.contact.jobTitle}</p>
          </div>
          <div className="text-right text-[10.5px] text-slate-600 space-y-0.5 shrink-0">
            {resume.contact.email && <p>{resume.contact.email}</p>}
            {resume.contact.phone && <p>{resume.contact.phone}</p>}
            {resume.contact.location && <p>{resume.contact.location}</p>}
            {resume.contact.linkedin && <p>{resume.contact.linkedin}</p>}
          </div>
        </div>
      ) : config.headerStyle === 'bold-stripe' ? (
        <div className="mb-5 pb-3 border-b border-slate-200">
          <div className="w-16 h-1.5 rounded-full mb-3" style={{ backgroundColor: accent }} />
          <h1
            className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900"
            style={{ fontFamily: getHeadingFont() }}
          >
            {resume.contact.fullName}
          </h1>
          <p className="text-sm font-bold text-slate-600 mt-0.5" style={{ color: accent }}>{resume.contact.jobTitle}</p>
          <div className="flex flex-wrap gap-3 text-[11px] text-slate-600 mt-2">
            {resume.contact.email && <span>{resume.contact.email}</span>}
            {resume.contact.phone && <span>• {resume.contact.phone}</span>}
            {resume.contact.location && <span>• {resume.contact.location}</span>}
            {resume.contact.linkedin && <span>• {resume.contact.linkedin}</span>}
          </div>
        </div>
      ) : config.headerStyle === 'minimal' ? (
        <div className="mb-4 pb-2 border-b border-slate-100 flex justify-between items-baseline">
          <div>
            <h1
              className="text-xl sm:text-2xl font-light tracking-wide text-slate-900"
              style={{ fontFamily: getHeadingFont() }}
            >
              {resume.contact.fullName}
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{resume.contact.jobTitle}</p>
          </div>
          <div className="text-right text-[10px] text-slate-500 space-y-0.5">
            {resume.contact.email && <p>{resume.contact.email}</p>}
            {resume.contact.phone && <p>{resume.contact.phone}</p>}
            {resume.contact.location && <p>{resume.contact.location}</p>}
          </div>
        </div>
      ) : (
        <div className={`mb-4 pb-3 border-b border-slate-200/80 ${config.headerStyle === 'centered' ? 'text-center' : 'text-left'}`}>
          <h1
            className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight"
            style={{ color: accent, fontFamily: getHeadingFont() }}
          >
            {resume.contact.fullName}
          </h1>
          <p className="text-sm font-bold text-slate-700 mt-0.5">{resume.contact.jobTitle}</p>
          <div
            className={`flex flex-wrap gap-2.5 text-[11px] text-slate-600 mt-1.5 ${
              config.headerStyle === 'centered' ? 'justify-center' : 'justify-start'
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

      {/* ── Dynamic Content Layout ── */}
      {config.layout === 'sidebar-left' ? (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1 space-y-4 pr-4 border-r border-slate-200">
            {sectionOrder
              .filter((k) => k === 'skills' || k === 'education' || k === 'certifications' || k === 'languages')
              .map((k) => renderSection(k))}
          </div>
          <div className="col-span-2 space-y-4">
            {sectionOrder
              .filter((k) => k === 'summary' || k === 'experience' || k === 'projects' || k === 'awards' || k === 'publications' || k === 'volunteer')
              .map((k) => renderSection(k))}
          </div>
        </div>
      ) : config.layout === 'sidebar-right' ? (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4 pr-4 border-r border-slate-200">
            {sectionOrder
              .filter((k) => k === 'summary' || k === 'experience' || k === 'projects' || k === 'awards' || k === 'publications' || k === 'volunteer')
              .map((k) => renderSection(k))}
          </div>
          <div className="col-span-1 space-y-4 pl-1">
            {sectionOrder
              .filter((k) => k === 'skills' || k === 'education' || k === 'certifications' || k === 'languages')
              .map((k) => renderSection(k))}
          </div>
        </div>
      ) : config.layout === 'two-column' ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-7 space-y-4">
            {sectionOrder
              .filter((k) => k === 'summary' || k === 'experience' || k === 'projects')
              .map((k) => renderSection(k))}
          </div>
          <div className="md:col-span-5 space-y-4 md:border-l md:border-slate-200 md:pl-5">
            {sectionOrder
              .filter((k) => k === 'skills' || k === 'education' || k === 'certifications' || k === 'languages' || k === 'awards' || k === 'publications' || k === 'volunteer')
              .map((k) => renderSection(k))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {sectionOrder.map((k) => renderSection(k))}
        </div>
      )}
    </div>
  );
}
