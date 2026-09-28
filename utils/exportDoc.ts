import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
} from 'docx';
import { ResumeData, TemplateConfig, SectionKey } from '../types/resume';
import { formatDate, formatDateRange } from './formatDate';

const noBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

export async function exportResumeToDoc(resume: ResumeData, config?: TemplateConfig) {
  const accentHex = (config?.defaultAccent || '#1e3a5f').replace('#', '');
  const fullName = resume.contact.fullName || 'Resume';

  const children: (Paragraph | Table)[] = [];

  const visibleSections = resume.visibleSections || {
    summary: true, experience: true, education: true, projects: true, skills: true, certifications: true,
    languages: false, awards: false, publications: false, volunteer: false,
  };

  // 1. Header: Full Name
  children.push(
    new Paragraph({
      alignment: config?.headerStyle === 'centered' ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { before: 0, after: 60 },
      children: [
        new TextRun({
          text: fullName.toUpperCase(),
          bold: true,
          size: 40, // 20pt
          color: accentHex,
          font: 'Calibri',
        }),
      ],
    })
  );

  // Job Title
  if (resume.contact.jobTitle) {
    children.push(
      new Paragraph({
        alignment: config?.headerStyle === 'centered' ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { before: 0, after: 80 },
        children: [
          new TextRun({
            text: resume.contact.jobTitle,
            bold: true,
            size: 22, // 11pt
            color: '334155',
            font: 'Calibri',
          }),
        ],
      })
    );
  }

  // Contact Details
  const contactParts: string[] = [];
  if (resume.contact.location) contactParts.push(resume.contact.location);
  if (resume.contact.phone) contactParts.push(resume.contact.phone);
  if (resume.contact.email) contactParts.push(resume.contact.email);
  if (resume.contact.website) contactParts.push(resume.contact.website.replace(/^https?:\/\//, ''));
  if (resume.contact.linkedin) contactParts.push(resume.contact.linkedin.replace(/^https?:\/\//, ''));
  if (resume.contact.github) contactParts.push(resume.contact.github.replace(/^https?:\/\//, ''));

  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        alignment: config?.headerStyle === 'centered' ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { before: 0, after: 200 },
        border: {
          bottom: {
            style: BorderStyle.SINGLE,
            size: 6,
            color: 'CBD5E1',
          },
        },
        children: [
          new TextRun({
            text: contactParts.join('  •  '),
            size: 18, // 9pt
            color: '64748B',
            font: 'Calibri',
          }),
        ],
      })
    );
  }

  // Helper for Section Headings
  const createSectionHeading = (title: string) => {
    return new Paragraph({
      spacing: { before: 200, after: 100 },
      border: {
        bottom: {
          style: BorderStyle.SINGLE,
          size: 10,
          color: accentHex,
        },
      },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: 22, // 11pt
          color: accentHex,
          font: 'Calibri',
        }),
      ],
    });
  };

  // Section Ordering
  const sectionOrder: SectionKey[] = resume.sectionOrder || ['summary', 'experience', 'education', 'projects', 'skills', 'certifications', 'languages', 'awards', 'publications', 'volunteer'];

  for (const key of sectionOrder) {
    // Check visibility
    if (visibleSections[key] === false) continue;

    if (key === 'summary' && resume.contact.summary) {
      children.push(createSectionHeading('Professional Summary'));
      children.push(
        new Paragraph({
          spacing: { before: 60, after: 120 },
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: resume.contact.summary,
              size: 20, // 10pt
              color: '334155',
              font: 'Calibri',
            }),
          ],
        })
      );
    } else if (key === 'experience' && resume.experience?.length > 0) {
      children.push(createSectionHeading('Work Experience'));
      for (const exp of resume.experience) {
        const dateStr = formatDateRange(exp.startDate, exp.endDate, exp.current);

        // Header Table for Position and Date
        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: noBorders,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    borders: noBorders,
                    children: [
                      new Paragraph({
                        spacing: { before: 80, after: 20 },
                        children: [
                          new TextRun({
                            text: exp.position,
                            bold: true,
                            size: 21,
                            color: '0F172A',
                            font: 'Calibri',
                          }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { before: 0, after: 60 },
                        children: [
                          new TextRun({
                            text: `${exp.company}${exp.employmentType ? ` · ${exp.employmentType}` : ''}${exp.location ? ` — ${exp.location}` : ''}`,
                            bold: true,
                            size: 19,
                            color: '475569',
                            font: 'Calibri',
                          }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    borders: noBorders,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        spacing: { before: 80, after: 0 },
                        children: [
                          new TextRun({
                            text: dateStr,
                            bold: true,
                            size: 19,
                            color: '64748B',
                            font: 'Calibri',
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          })
        );

        // Description
        if (exp.description) {
          children.push(
            new Paragraph({
              spacing: { before: 20, after: 40 },
              alignment: AlignmentType.JUSTIFIED,
              children: [
                new TextRun({
                  text: exp.description,
                  size: 19,
                  color: '334155',
                  font: 'Calibri',
                }),
              ],
            })
          );
        }

        // Bullet Accomplishments
        if (exp.highlights && exp.highlights.length > 0) {
          for (const h of exp.highlights.filter(h => h.trim())) {
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { before: 20, after: 40 },
                alignment: AlignmentType.JUSTIFIED,
                children: [
                  new TextRun({
                    text: h,
                    size: 19,
                    color: '334155',
                    font: 'Calibri',
                  }),
                ],
              })
            );
          }
        }

        // Technologies
        if (exp.technologies && exp.technologies.length > 0) {
          children.push(
            new Paragraph({
              spacing: { before: 0, after: 40 },
              children: [
                new TextRun({
                  text: `Technologies: ${exp.technologies.join(', ')}`,
                  size: 18,
                  color: '64748B',
                  font: 'Consolas',
                }),
              ],
            })
          );
        }
      }
    } else if (key === 'education' && resume.education?.length > 0) {
      children.push(createSectionHeading('Education'));
      for (const edu of resume.education) {
        const dateStr = formatDateRange(edu.startDate, edu.endDate, edu.current);
        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: noBorders,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    borders: noBorders,
                    children: [
                      new Paragraph({
                        spacing: { before: 60, after: 20 },
                        children: [
                          new TextRun({
                            text: edu.institution,
                            bold: true,
                            size: 21,
                            color: '0F172A',
                            font: 'Calibri',
                          }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { before: 0, after: 60 },
                        children: [
                          new TextRun({
                            text: `${edu.degree}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}${edu.gpa ? ` • GPA: ${edu.gpa}` : ''}`,
                            size: 19,
                            color: '475569',
                            font: 'Calibri',
                          }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    borders: noBorders,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        spacing: { before: 60, after: 0 },
                        children: [
                          new TextRun({
                            text: dateStr,
                            bold: true,
                            size: 19,
                            color: '64748B',
                            font: 'Calibri',
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          })
        );

        // Coursework
        if (edu.coursework && edu.coursework.length > 0) {
          children.push(
            new Paragraph({
              spacing: { before: 0, after: 40 },
              children: [
                new TextRun({ text: 'Coursework: ', bold: true, size: 18, color: '0F172A', font: 'Calibri' }),
                new TextRun({ text: edu.coursework.join(', '), size: 18, color: '475569', font: 'Calibri' }),
              ],
            })
          );
        }

        // Academic Achievements
        if (edu.academicAchievements && edu.academicAchievements.length > 0) {
          children.push(
            new Paragraph({
              spacing: { before: 0, after: 40 },
              children: [
                new TextRun({ text: 'Achievements: ', bold: true, size: 18, color: '0F172A', font: 'Calibri' }),
                new TextRun({ text: edu.academicAchievements.join(', '), size: 18, color: '475569', font: 'Calibri' }),
              ],
            })
          );
        }
      }
    } else if (key === 'projects' && resume.projects?.length > 0) {
      children.push(createSectionHeading('Key Technical Projects'));
      for (const proj of resume.projects) {
        const dateStr = formatDateRange(proj.startDate, proj.endDate);
        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: noBorders,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    borders: noBorders,
                    children: [
                      new Paragraph({
                        spacing: { before: 60, after: 20 },
                        children: [
                          new TextRun({
                            text: proj.name,
                            bold: true,
                            size: 21,
                            color: '0F172A',
                            font: 'Calibri',
                          }),
                          ...(proj.role
                            ? [
                                new TextRun({
                                  text: ` • ${proj.role}`,
                                  size: 19,
                                  color: '475569',
                                  font: 'Calibri',
                                }),
                              ]
                            : []),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    borders: noBorders,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        spacing: { before: 60, after: 0 },
                        children: [
                          new TextRun({
                            text: dateStr,
                            bold: true,
                            size: 19,
                            color: '64748B',
                            font: 'Calibri',
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          })
        );

        if (proj.technologies && proj.technologies.length > 0) {
          children.push(
            new Paragraph({
              spacing: { before: 0, after: 40 },
              children: [
                new TextRun({
                  text: `Stack: [${proj.technologies.join(', ')}]`,
                  size: 18,
                  color: '64748B',
                  font: 'Consolas',
                }),
              ],
            })
          );
        }

        if (proj.description) {
          children.push(
            new Paragraph({
              spacing: { before: 0, after: 40 },
              alignment: AlignmentType.JUSTIFIED,
              children: [
                new TextRun({
                  text: proj.description,
                  size: 19,
                  color: '334155',
                  font: 'Calibri',
                }),
              ],
            })
          );
        }

        if (proj.highlights && proj.highlights.length > 0) {
          for (const h of proj.highlights.filter(h => h.trim())) {
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { before: 20, after: 40 },
                alignment: AlignmentType.JUSTIFIED,
                children: [
                  new TextRun({
                    text: h,
                    size: 19,
                    color: '334155',
                    font: 'Calibri',
                  }),
                ],
              })
            );
          }
        }
      }
    } else if (key === 'skills' && resume.skills?.length > 0) {
      children.push(createSectionHeading('Technical Skills'));
      for (const cat of resume.skills) {
        children.push(
          new Paragraph({
            spacing: { before: 20, after: 60 },
            children: [
              new TextRun({
                text: `${cat.category}: `,
                bold: true,
                size: 20,
                color: '0F172A',
                font: 'Calibri',
              }),
              new TextRun({
                text: cat.skills.join(', '),
                size: 20,
                color: '334155',
                font: 'Calibri',
              }),
            ],
          })
        );
      }
    } else if (key === 'certifications' && resume.certifications?.length > 0) {
      children.push(createSectionHeading('Certifications & Credentials'));
      for (const cert of resume.certifications) {
        const parts: TextRun[] = [
          new TextRun({
            text: cert.name,
            bold: true,
            size: 20,
            color: '0F172A',
            font: 'Calibri',
          }),
          new TextRun({
            text: ` — ${cert.issuer}${cert.date ? ` (Issued ${formatDate(cert.date)})` : ''}`,
            size: 20,
            color: '64748B',
            font: 'Calibri',
          }),
        ];
        if (cert.credentialId) {
          parts.push(new TextRun({ text: ` | ID: ${cert.credentialId}`, size: 18, color: '94A3B8', font: 'Calibri' }));
        }
        if (cert.expiryDate && !cert.neverExpires) {
          parts.push(new TextRun({ text: ` | Expires: ${formatDate(cert.expiryDate)}`, size: 18, color: '94A3B8', font: 'Calibri' }));
        }
        if (cert.neverExpires) {
          parts.push(new TextRun({ text: ' | No expiration', size: 18, color: '94A3B8', font: 'Calibri' }));
        }
        children.push(
          new Paragraph({
            spacing: { before: 20, after: 60 },
            children: parts,
          })
        );
      }
    } else if (key === 'languages' && resume.languages && resume.languages.length > 0) {
      children.push(createSectionHeading('Languages'));
      for (const lang of resume.languages) {
        children.push(
          new Paragraph({
            spacing: { before: 20, after: 40 },
            children: [
              new TextRun({ text: lang.name, bold: true, size: 20, color: '0F172A', font: 'Calibri' }),
              new TextRun({ text: ` — ${lang.proficiency}`, size: 20, color: '475569', font: 'Calibri' }),
              ...(lang.certification ? [new TextRun({ text: ` (${lang.certification})`, size: 18, color: '64748B', font: 'Calibri' })] : []),
            ],
          })
        );
      }
    } else if (key === 'awards' && resume.awards && resume.awards.length > 0) {
      children.push(createSectionHeading('Awards & Achievements'));
      for (const award of resume.awards) {
        children.push(
          new Paragraph({
            spacing: { before: 20, after: 20 },
            children: [
              new TextRun({ text: award.title, bold: true, size: 20, color: '0F172A', font: 'Calibri' }),
              new TextRun({ text: ` — ${award.issuer}${award.date ? ` (${formatDate(award.date)})` : ''}`, size: 20, color: '64748B', font: 'Calibri' }),
            ],
          })
        );
        if (award.description) {
          children.push(
            new Paragraph({
              spacing: { before: 0, after: 60 },
              children: [new TextRun({ text: award.description, size: 19, color: '334155', font: 'Calibri' })],
            })
          );
        }
      }
    } else if (key === 'publications' && resume.publications && resume.publications.length > 0) {
      children.push(createSectionHeading('Publications'));
      for (const pub of resume.publications) {
        children.push(
          new Paragraph({
            spacing: { before: 20, after: 20 },
            children: [
              new TextRun({ text: pub.title, bold: true, size: 20, color: '0F172A', font: 'Calibri' }),
              new TextRun({ text: ` — ${pub.publisher}${pub.date ? ` (${formatDate(pub.date)})` : ''}`, size: 20, color: '64748B', font: 'Calibri' }),
            ],
          })
        );
        if (pub.url) {
          children.push(
            new Paragraph({
              spacing: { before: 0, after: 20 },
              children: [new TextRun({ text: pub.url, size: 18, color: '3B82F6', font: 'Calibri' })],
            })
          );
        }
        if (pub.description) {
          children.push(
            new Paragraph({
              spacing: { before: 0, after: 60 },
              children: [new TextRun({ text: pub.description, size: 19, color: '334155', font: 'Calibri' })],
            })
          );
        }
      }
    } else if (key === 'volunteer' && resume.volunteer && resume.volunteer.length > 0) {
      children.push(createSectionHeading('Volunteer Experience'));
      for (const vol of resume.volunteer) {
        const dateStr = formatDateRange(vol.startDate, vol.endDate, vol.current);
        children.push(
          new Paragraph({
            spacing: { before: 60, after: 20 },
            children: [
              new TextRun({ text: vol.role, bold: true, size: 21, color: '0F172A', font: 'Calibri' }),
              new TextRun({ text: ` at ${vol.organization}`, size: 19, color: '475569', font: 'Calibri' }),
              ...(dateStr ? [new TextRun({ text: ` (${dateStr})`, size: 19, color: '64748B', font: 'Calibri' })] : []),
            ],
          })
        );
        if (vol.description) {
          children.push(
            new Paragraph({
              spacing: { before: 0, after: 40 },
              children: [new TextRun({ text: vol.description, size: 19, color: '334155', font: 'Calibri' })],
            })
          );
        }
        if (vol.highlights && vol.highlights.length > 0) {
          for (const h of vol.highlights.filter(h => h.trim())) {
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { before: 10, after: 30 },
                children: [new TextRun({ text: h, size: 19, color: '334155', font: 'Calibri' })],
              })
            );
          }
        }
      }
    }
  }

  // Create Document with standard A4 page margins
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 inch (720 dxa)
              bottom: 720,
              left: 720,
              right: 720,
            },
          },
        },
        children,
      },
    ],
  });

  // Pack into binary DOCX blob and trigger download
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.href = url;
  downloadAnchor.download = `CV_${fullName.replace(/\s+/g, '_')}.docx`;
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  document.body.removeChild(downloadAnchor);
  URL.revokeObjectURL(url);
}
