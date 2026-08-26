'use client';

import React from 'react';
import { ResumeData, TemplateConfig } from '../../../types/resume';
import { Globe, Mail, Phone, MapPin, Linkedin, Github } from 'lucide-react';

interface ConfigurableTemplateProps {
  resume: ResumeData;
  config: TemplateConfig;
}

export default function ConfigurableTemplate({ resume, config }: ConfigurableTemplateProps) {
  const accent = config.defaultAccent || '#1e3a5f';

  const fontClass =
    config.fontProfile === 'serif'
      ? 'font-serif'
      : config.fontProfile === 'mono'
      ? 'font-mono text-[11px]'
      : 'font-sans';

  const sectionOrder = resume.sectionOrder || ['summary', 'experience', 'education', 'projects', 'skills', 'certifications'];

  const renderSection = (key: string) => {
    switch (key) {
      case 'summary':
        return resume.contact.summary ? (
          <div key="summary" className="mb-6">
            <h2
              className="text-xs font-bold uppercase tracking-wider mb-1.5 pb-1 border-b"
              style={{ color: accent, borderColor: `${accent}40` }}
            >
              Professional Summary
            </h2>
            <p className="text-slate-700 leading-relaxed">{resume.contact.summary}</p>
          </div>
        ) : null;

      case 'experience':
        return (
          <div key="experience" className="mb-6">
            <h2
              className="text-xs font-bold uppercase tracking-wider mb-3 pb-1 border-b"
              style={{ color: accent, borderColor: `${accent}40` }}
            >
              Work Experience
            </h2>
            <div className="space-y-4">
              {resume.experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-extrabold text-slate-900 text-xs">{exp.position}</h3>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700 font-medium text-[11px] mb-1.5">
                    <span>{exp.company}</span>
                    <span>{exp.location}</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 leading-relaxed">
                    {exp.highlights.map((bullet, idx) => (
                      <li key={idx} className="pl-1">{bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );

      case 'education':
        return (
          <div key="education" className="mb-6">
            <h2
              className="text-xs font-bold uppercase tracking-wider mb-3 pb-1 border-b"
              style={{ color: accent, borderColor: `${accent}40` }}
            >
              Education
            </h2>
            <div className="space-y-3">
              {resume.education.map((edu) => (
                <div key={edu.id} className="flex justify-between items-baseline">
                  <div>
                    <h3 className="font-extrabold text-slate-900">{edu.institution}</h3>
                    <p className="text-slate-700 text-[11px]">
                      {edu.degree} in {edu.fieldOfStudy}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">
                    {edu.startDate} – {edu.endDate}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'projects':
        return resume.projects.length > 0 ? (
          <div key="projects" className="mb-6">
            <h2
              className="text-xs font-bold uppercase tracking-wider mb-3 pb-1 border-b"
              style={{ color: accent, borderColor: `${accent}40` }}
            >
              Key Technical Projects
            </h2>
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
                        {proj.startDate} {proj.endDate ? `– ${proj.endDate}` : ''}
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
                  {proj.highlights && proj.highlights.length > 0 && (
                    <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-[11px] leading-relaxed pt-1">
                      {proj.highlights.map((bullet, idx) => (
                        <li key={idx} className="pl-1">{bullet}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null;

      case 'skills':
        return (
          <div key="skills" className="mb-6">
            <h2
              className="text-xs font-bold uppercase tracking-wider mb-3 pb-1 border-b"
              style={{ color: accent, borderColor: `${accent}40` }}
            >
              Skills & Technologies
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {resume.skills.map((cat) => (
                <div key={cat.id}>
                  <p className="font-bold text-slate-900">{cat.category}</p>
                  <p className="text-slate-700 mt-0.5">{cat.skills.join(', ')}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'certifications':
        return resume.certifications && resume.certifications.length > 0 ? (
          <div key="certifications" className="mb-6">
            <h2
              className="text-xs font-bold uppercase tracking-wider mb-3 pb-1 border-b"
              style={{ color: accent, borderColor: `${accent}40` }}
            >
              Certifications & Industry Credentials
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {resume.certifications.map((cert) => (
                <div key={cert.id} className="p-2.5 rounded-lg border border-slate-200/80 bg-slate-50/50">
                  <p className="font-extrabold text-slate-900 text-xs">{cert.name}</p>
                  <p className="text-[11px] font-semibold text-slate-600 mt-0.5">
                    {cert.issuer} • Issued {cert.date}
                  </p>
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
      style={{ backgroundColor: config.bodyBg || '#ffffff' }}
    >
      {/* Dynamic Header Style */}
      {config.headerStyle === 'banner' ? (
        <div
          className="-mx-8 -mt-8 sm:-mx-10 sm:-mt-10 p-8 mb-6 text-white"
          style={{ backgroundColor: accent }}
        >
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
            {resume.contact.fullName}
          </h1>
          <p className="text-sm font-semibold opacity-90 mt-1">{resume.contact.jobTitle}</p>
          <div className="flex flex-wrap gap-4 text-[11px] opacity-80 mt-3">
            {resume.contact.email && <span>📧 {resume.contact.email}</span>}
            {resume.contact.phone && <span>📞 {resume.contact.phone}</span>}
            {resume.contact.location && <span>📍 {resume.contact.location}</span>}
            {resume.contact.website && <span>🌐 {resume.contact.website}</span>}
            {resume.contact.linkedin && <span>🔗 {resume.contact.linkedin}</span>}
            {resume.contact.github && <span>💻 {resume.contact.github}</span>}
          </div>
        </div>
      ) : (
        <div className={`mb-6 pb-4 ${config.headerStyle === 'centered' ? 'text-center' : 'text-left'}`}>
          <h1
            className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight"
            style={{ color: accent }}
          >
            {resume.contact.fullName}
          </h1>
          <p className="text-sm font-bold text-slate-700 mt-0.5">{resume.contact.jobTitle}</p>
          <div
            className={`flex flex-wrap gap-3 text-[11px] text-slate-600 mt-2 ${
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

      {/* Main Content Layout - Dynamic Ordering */}
      <div className={config.layout === 'sidebar-left' ? 'grid grid-cols-3 gap-6' : 'space-y-4'}>
        {config.layout === 'sidebar-left' ? (
          <>
            <div className="col-span-1 space-y-4 pr-4 border-r border-slate-200">
              {sectionOrder
                .filter((k) => k === 'skills' || k === 'certifications' || k === 'education')
                .map((k) => renderSection(k))}
            </div>
            <div className="col-span-2 space-y-4">
              {sectionOrder
                .filter((k) => k === 'summary' || k === 'experience' || k === 'projects')
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
