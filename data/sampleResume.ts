import { ResumeData } from '../types/resume';

export const SAMPLE_RESUME_DATA: ResumeData = {
  contact: {
    fullName: "Rajat Ambedkar",
    jobTitle: "Senior Full Stack Engineer & UI Architect",
    email: "",
    phone: "",
    location: "Azad Nagar, Ambala Cantt, Haryana",
    website: "https://rj-ambedkar-portfolio.netlify.app/",
    linkedin: "",
    github: "github.com/HelloRajatRJ",
    summary: "High-performing Senior Full Stack Engineer & UI Architect specializing in React, TypeScript, JavaScript, Node.js. Demonstrated track record of architecting scalable web applications, optimizing system performance and delivering business-critical features. Proven leader in agile, fast-paced engineering environments."
  },
  experience: [
    {
      id: "exp-1",
      company: "Seasia Infotech Pvt Ltd",
      position: "Software Engineer / Full Stack Developer",
      location: "Mohali, Punjab, India",
      startDate: "May 2022",
      endDate: "Present",
      current: true,
      highlights: [
        "Spearheaded production platform features using React, driving increase in operational throughput and user engagement.",
        "Collaborated cross-functional engineering teams to implement TypeScript and automated testing workflows.",
        "Optimized system latency and front-end render performance enforcing strict standards and modern web vitals benchmarks."
      ]
    },
    {
      id: "exp-2",
      company: "Solitaire Infosys",
      position: "Software Engineer Trainee",
      location: "Mohali, India",
      startDate: "Mar 2021",
      endDate: "Apr 2022",
      current: false,
      highlights: [
        "Drove platform development driving a 35% increase in throughput and user engagement.",
        "Collaborated across cross-functional engineering teams to implement JavaScript and automated testing workflows.",
        "Optimized system latency and front-end render performance by enforcing strict coding standards and modern web vitals benchmarks."
      ]
    }
  ],
  education: [
    {
      id: "edu-1",
      institution: "Chandigarh University",
      degree: "Bachelors of Computer Application (BCA)",
      fieldOfStudy: "Computer Science & Software Engineering",
      startDate: "",
      endDate: "",
      gpa: "",
      highlights: []
    }
  ],
  projects: [
    {
      id: "proj-1",
      name: "CereTax - Tax Compliance Platform",
      role: "Full-Stack Developer",
      startDate: "Jan 2023",
      endDate: "Apr 2026",
      link: "",
      repoLink: "",
      technologies: ["React", "TypeScript", "JavaScript", "Node.js", "AWS", "Tailwind CSS", "React-Admin"],
      description: "Engineered CereTax — Cloud-Native Tax Compliance platform leveraging React, TypeScript, JavaScript & Node.js to solve enterprise challenges, guarantee user experience, and deliver fast API response times.",
      highlights: [
        "Architected scalable core modules with React following clean code design patterns.",
        "Implemented automated testing and deployment for TypeScript services.",
        "Developed reusable React components and responsive layouts using Tailwind CSS."
      ]
    },
    {
      id: "proj-2",
      name: "Wesellrestaurants",
      role: "Frontend Developer",
      startDate: "Jun 2024",
      endDate: "Oct 2024",
      link: "",
      repoLink: "",
      technologies: ["React JS", "Next.js", "TypeScript", "PHP", "Laravel", "AWS", "Bootstrap"],
      description: "Worked on both the public-facing website and Admin panel using Next.js. Developed responsive UI, reusable components, API integrations, form handling, data management and performance-focused features for the restaurant buying, selling, and leasing platform.",
      highlights: [
        "Developed the public-facing restaurant marketplace using Next.js and React.js.",
        "Implemented authentication and role-based access admin functionality.",
        "Built and maintained a feature-rich Admin panel for platform data and operations."
      ]
    },
    {
      id: "proj-3",
      name: "HyeConnect",
      role: "Full Stack Lead Developer",
      startDate: "Mar 2024",
      endDate: "Dec 2024",
      link: "",
      repoLink: "",
      technologies: ["Nuxt", "Tailwind", "GraphQL", "Node", "AWS Amplify"],
      description: "HyeConnect is a community and collaboration platform designed to connect users, communities, and organizations. The platform provides features for creating and managing groups, discussions, tasks, events, and user interactions.",
      highlights: [
        "Implemented user profiles, groups, forums, tasks, and event management features.",
        "Optimized application performance across responsive devices.",
        "Implemented forms validations, CRUD operations, and interactive workflows."
      ]
    },
    {
      id: "proj-4",
      name: "iallo - Web Chrome Extension",
      role: "Senior Lead Developer",
      startDate: "",
      endDate: "",
      link: "",
      repoLink: "",
      technologies: ["React", "Chrome Extension API", "JavaScript"],
      description: "iallo is a hospitality technology platform that helps hotels enhance the guest experience by providing digital tools and services for communication, travel information, and guest engagement.",
      highlights: [
        "Built reusable and scalable UI components for different hospitality use cases.",
        "Collaborated with backend developers to deliver new features and enhancements.",
        "Implemented responsive layouts for desktop, tablet, and mobile devices."
      ]
    }
  ],
  skills: [
    {
      id: "skill-1",
      category: "Frontend",
      skills: ["React", "TypeScript", "Tailwind CSS", "Framer Motion", "Zustand", "HTML5/CSS3", "JavaScript", "Agile", "Testing"]
    },
    {
      id: "skill-2",
      category: "Tools & Testing",
      skills: ["Git", "Vite", "Webpack", "Jest", "Cypress", "CI/CD Pipelines", "Figma", "Postman"]
    },
    {
      id: "skill-3",
      category: "Backend & Cloud",
      skills: ["Node.js", "Express", "Python", "PostgreSQL", "Docker", "AWS (Lambda)", "Redis"]
    },
    {
      id: "skill-4",
      category: "Beginner Skills",
      skills: ["Java", "Golang (Go)", "Spring Boot", "Three.js", "Python"]
    }
  ],
  certifications: [
    {
      id: "cert-1",
      name: "Certificate of Appreciation",
      issuer: "Seasia Infotech Services",
      date: "2025"
    }
  ],
  sectionOrder: ['summary', 'experience', 'education', 'projects', 'skills', 'certifications']
};
