import { ResumeData } from '../types/resume';

export const SAMPLE_RESUME_DATA: ResumeData = {
  contact: {
    fullName: "Alex Rivera",
    jobTitle: "Senior Full-Stack & Cloud Architect",
    email: "alex.rivera@architect.dev",
    phone: "+1 (555) 234-5678",
    location: "San Francisco, CA",
    website: "https://alexrivera.dev",
    linkedin: "linkedin.com/in/alexrivera-architect",
    github: "github.com/alexrivera-dev",
    summary: "High-impact Lead Software Architect with 8+ years building enterprise microservices, AI-driven automation pipelines, and high-frequency real-time web applications. Expert in React 19, Next.js 15, Node.js, TypeScript, and AWS Cloud Native infrastructure."
  },
  experience: [
    {
      id: "exp-1",
      company: "Apex Cloud Innovations",
      position: "Lead Full-Stack Architect",
      location: "San Francisco, CA",
      startDate: "2022-03",
      endDate: "Present",
      current: true,
      highlights: [
        "Architected distributed Next.js 15 & Node.js microservices handling 4.2M daily active API requests with 99.99% uptime.",
        "Integrated Google Gemini LLM pipelines for automated log analysis, cutting incident root-cause triage time by 64%.",
        "Pioneered zero-downtime CI/CD Kubernetes deployments using Docker, Terraform, and GitHub Actions.",
        "Mentored team of 14 senior engineers across frontend, backend, and DevOps domains."
      ]
    },
    {
      id: "exp-2",
      company: "Vanguard Tech Labs",
      position: "Senior React & Node Engineer",
      location: "Austin, TX",
      startDate: "2019-06",
      endDate: "2022-02",
      current: false,
      highlights: [
        "Engineered real-time analytics dashboard in React & WebSockets reducing end-to-end data latency from 3.2s to 120ms.",
        "Refactored legacy REST monolithic architecture into modular GraphQL APIs, boosting mobile app response times by 45%.",
        "Built automated ATS candidate screening tool with custom keyword extraction engine."
      ]
    },
    {
      id: "exp-3",
      company: "Quantum Systems Inc",
      position: "Full-Stack Software Developer",
      location: "San Jose, CA",
      startDate: "2017-06",
      endDate: "2019-05",
      current: false,
      highlights: [
        "Developed responsive single-page applications using React, Redux, and TypeScript.",
        "Implemented secure JWT authentication & OAuth2 integration for enterprise customer portal."
      ]
    }
  ],
  education: [
    {
      id: "edu-1",
      institution: "University of California, Berkeley",
      degree: "B.S. in Computer Science & Engineering",
      fieldOfStudy: "Computer Science",
      startDate: "2013-08",
      endDate: "2017-05",
      gpa: "3.88 / 4.0",
      highlights: [
        "Deans Honor List 6 Consecutive Semesters",
        "President of ACM Competitive Programming Chapter"
      ]
    },
    {
      id: "edu-2",
      institution: "Stanford University (Executive Online)",
      degree: "Certificate in Cloud Architecture & System Design",
      fieldOfStudy: "Distributed Systems",
      startDate: "2020-01",
      endDate: "2020-06",
      highlights: [
        "Specialized in high-scalability cloud infrastructure and event-driven architecture."
      ]
    }
  ],
  projects: [
    {
      id: "proj-1",
      name: "Resume Architect & AI Optimizer",
      role: "Lead Full-Stack Architect",
      startDate: "2024-01",
      endDate: "Present",
      link: "https://resume-architect.dev",
      repoLink: "https://github.com/alexrivera-dev/resume-architect",
      technologies: ["Next.js 15", "TypeScript", "Gemini AI", "Tailwind CSS", "PDF.js"],
      description: "AI-powered candidate CV optimization suite with real-time ATS match scoring, PDF parsing, and multi-template renderer.",
      highlights: [
        "Analyzes CVs against target Job Descriptions using Gemini 1.5 Flash.",
        "Real-time ATS score gauge calculation with action-driven bullet suggestions.",
        "Integrated Razorpay microtransactions for template unlocking and candidate passes."
      ]
    },
    {
      id: "proj-2",
      name: "Distributed Mock Test Arena",
      role: "Principal Backend Engineer",
      startDate: "2023-06",
      endDate: "2023-12",
      link: "https://mocktest-arena.dev",
      repoLink: "https://github.com/alexrivera-dev/mock-test-arena",
      technologies: ["React", "Node.js", "Express", "MongoDB", "Razorpay"],
      description: "Proctored technical assessment engine covering 16 stacks with daily question shuffling and PDF rank certification.",
      highlights: [
        "1,120 comprehensive question bank across 16 core technology domains.",
        "Proctored timer, navigator grid, topic metrics, and automated PDF certification."
      ]
    }
  ],
  skills: [
    {
      id: "skill-1",
      category: "Frontend Stack",
      skills: ["React 19", "Next.js (App Router)", "TypeScript", "Tailwind CSS", "Redux Toolkit", "GraphQL", "HTML5/CSS3"]
    },
    {
      id: "skill-2",
      category: "Backend & Cloud",
      skills: ["Node.js", "Express", "Python", "AWS (EC2, S3, Lambda)", "Docker", "Kubernetes", "PostgreSQL", "MongoDB", "Redis"]
    },
    {
      id: "skill-3",
      category: "AI & Architectures",
      skills: ["Gemini AI SDK", "REST & GraphQL APIs", "Microservices", "CI/CD Pipelines", "System Design", "JWT Auth"]
    },
    {
      id: "skill-4",
      category: "DevOps & Tools",
      skills: ["Git", "GitHub Actions", "Terraform", "Jest", "Cypress", "Webpack", "Vite"]
    }
  ],
  certifications: [
    {
      id: "cert-1",
      name: "AWS Certified Solutions Architect – Professional",
      issuer: "Amazon Web Services",
      date: "2023-11"
    },
    {
      id: "cert-2",
      name: "Certified Kubernetes Application Developer (CKAD)",
      issuer: "Linux Foundation",
      date: "2022-08"
    },
    {
      id: "cert-3",
      name: "Google Cloud Certified Professional Cloud Architect",
      issuer: "Google Cloud",
      date: "2021-04"
    }
  ],
  sectionOrder: ['summary', 'experience', 'education', 'projects', 'skills', 'certifications']
};
