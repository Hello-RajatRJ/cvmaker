import { Question, TechnologyPack } from '../types/assessment';

export const TECHNOLOGY_PACKS: TechnologyPack[] = [
  { id: 'javascript', name: 'JavaScript (ES6+)', icon: '⚡', category: 'frontend', questionCount: 70, description: 'Closures, Event Loop, Promises, Prototypes & Async' },
  { id: 'typescript', name: 'TypeScript', icon: '🔷', category: 'frontend', questionCount: 70, description: 'Generics, Utility Types, Interfaces, Type Inference' },
  { id: 'react', name: 'React.js 19', icon: '⚛️', category: 'frontend', questionCount: 70, description: 'Hooks, Virtual DOM, Fiber, Server Components & State' },
  { id: 'nextjs', name: 'Next.js', icon: '▲', category: 'frontend', questionCount: 70, description: 'App Router, SSR, SSG, ISR, Server Actions & Middleware' },
  { id: 'nodejs', name: 'Node.js', icon: '🟢', category: 'backend', questionCount: 70, description: 'Event Loop, Streams, Worker Threads, Modules & Clustering' },
  { id: 'express', name: 'Express.js', icon: '🚂', category: 'backend', questionCount: 70, description: 'Middleware, Routing, Error Handling & REST APIs' },
  { id: 'mongodb', name: 'MongoDB', icon: '🍃', category: 'database', questionCount: 70, description: 'Aggregation Pipelines, Indexing, Schema Design & Transactions' },
  { id: 'sql', name: 'SQL & Databases', icon: '🗄️', category: 'database', questionCount: 70, description: 'Joins, Indexing, Transactions, ACID & Query Tuning' },
  { id: 'aws', name: 'AWS Cloud', icon: '☁️', category: 'cloud', questionCount: 70, description: 'S3, EC2, Lambda, DynamoDB, ECS, CloudFront & IAM' },
  { id: 'azure', name: 'Azure Cloud', icon: '🔷', category: 'cloud', questionCount: 70, description: 'App Service, Blob Storage, Cosmos DB, Functions & AKS' },
  { id: 'python', name: 'Python', icon: '🐍', category: 'core', questionCount: 70, description: 'AsyncIO, Decorators, GIL, OOP & Memory Management' },
  { id: 'java', name: 'Java', icon: '☕', category: 'core', questionCount: 70, description: 'JVM Memory, Multithreading, Streams, Collections & OOP' },
  { id: 'springboot', name: 'Spring Boot', icon: '🌱', category: 'backend', questionCount: 70, description: 'Dependency Injection, Spring Security, JPA & REST' },
  { id: 'dotnet', name: '.NET & C#', icon: '💜', category: 'core', questionCount: 70, description: 'LINQ, CLR Memory, Async/Await, Web API & Dependency Injection' },
  { id: 'docker', name: 'Docker & Kubernetes', icon: '🐳', category: 'ai_devops', questionCount: 70, description: 'Multi-stage builds, Volumes, Networking & Docker Compose' },
  { id: 'systemdesign', name: 'System Design & Arch', icon: '🧠', category: 'core', questionCount: 70, description: 'Scalability, Load Balancing, Caching, Rate Limiting & Microservices' },
];

function generate70QuestionsForTech(techId: string, techName: string): Question[] {
  const topicsMap: Record<string, string[]> = {
    javascript: ['Closures & Scope', 'Event Loop & Microtasks', 'Prototypes & Inheritance', 'ES6+ Features', 'Async/Await & Promises', 'DOM & Memory', 'Modules'],
    typescript: ['Generics & Constraints', 'Utility Types', 'Interfaces vs Types', 'Type Narrowing', 'Decorators', 'Strict Mode', 'Mapped Types'],
    react: ['Hooks (useEffect, useCallback)', 'Virtual DOM & Reconciliation', 'Server Components', 'State & Context', 'Performance Memoization', 'Error Boundaries', 'Custom Hooks'],
    nextjs: ['App Router vs Pages Router', 'Server Side Rendering (SSR)', 'Static Site Generation (SSG)', 'Server Actions', 'Middleware & Edge', 'Route Handlers', 'Optimization'],
    nodejs: ['Event Loop Phases', 'Streams & Buffers', 'Worker Threads', 'Module System', 'File System', 'Memory Leaks', 'Process Management'],
    express: ['Middleware Execution', 'Routing & Params', 'Error Handling', 'JWT Authentication', 'Security (Helmet/CORS)', 'Rate Limiting', 'Body Parsing'],
    mongodb: ['Aggregation Pipeline', 'B-Tree & Compound Indexes', 'Schema Design', 'ACID Transactions', 'Sharding & Replication', 'Lookup Joins', 'TTL Indexes'],
    sql: ['Indexing & B-Trees', 'Joins & Unions', 'ACID & Isolation', 'Window Functions', 'Stored Procedures', 'Database Normalization', 'Locking & Concurrency'],
    aws: ['S3 & CloudFront', 'EC2 & Auto Scaling', 'AWS Lambda Serverless', 'DynamoDB NoSQL', 'IAM Policies & Roles', 'ECS & Fargate', 'VPC & Networking'],
    azure: ['Azure App Service', 'Azure Blob Storage', 'Azure Functions', 'Cosmos DB', 'Azure AKS', 'Azure Key Vault', 'Virtual Networks'],
    python: ['AsyncIO & Generators', 'Decorators & Metaclasses', 'GIL (Global Interpreter Lock)', 'Iterators & Yield', 'OOP & Dunder Methods', 'Context Managers', 'Multiprocessing'],
    java: ['JVM Memory Architecture', 'Multithreading & Concurrency', 'Java Streams API', 'Collections Framework', 'Interfaces & Polymorphism', 'Exception Handling', 'Generics'],
    springboot: ['Dependency Injection', 'Spring Boot Auto-Config', 'Spring Security & OAuth2', 'Spring Data JPA', 'REST Controllers', 'Actuator Metrics', 'Transactions'],
    dotnet: ['LINQ Queries', 'CLR Garbage Collection', 'Async/Await Patterns', 'ASP.NET Core Web API', 'Dependency Injection', 'Entity Framework Core', 'Middleware'],
    docker: ['Multi-Stage Dockerfiles', 'Docker Compose', 'Volumes & Mounts', 'Container Networking', 'Image Optimization', 'Container Security', 'Health Checks'],
    systemdesign: ['Distributed Rate Limiting', 'Load Balancing', 'Caching Strategies', 'Database Sharding', 'Message Queues (Kafka)', 'CDN Edge Caching', 'Microservices vs Monolith'],
  };

  const topics = topicsMap[techId] || ['Core Concepts', 'Advanced Patterns', 'Performance', 'Security', 'Best Practices', 'Debugging', 'Architecture'];
  const questions: Question[] = [];
  const difficulties: ('beginner' | 'intermediate' | 'advanced' | 'expert')[] = ['beginner', 'intermediate', 'advanced', 'expert'];

  for (let i = 1; i <= 70; i++) {
    const topic = topics[(i - 1) % topics.length];
    const difficulty = difficulties[(i - 1) % difficulties.length];
    const isCodeQuestion = i % 2 === 0;

    let questionText = `[${techName} Q#${i}] In production system design, how is ${topic} correctly implemented for maximum stability?`;
    let codeSnippet: string | undefined = undefined;

    if (isCodeQuestion) {
      questionText = `Analyze the following ${techName} code snippet for ${topic}. What is the accurate result or behavior?`;
      codeSnippet = `// ${techName} - ${topic} (Question #${i})
function verifyProductionFlow_${i}() {
  const status = "${topic} initialized";
  const priority = ${i * 5};
  return { status, priority, active: true };
}
console.log(verifyProductionFlow_${i}());`;
    }

    const options = [
      `Option A: Leverages ${topic} with non-blocking async execution pipelines and zero memory footprint overhead.`,
      `Option B: Triggers synchronous main-thread blocking leading to eventual queue overflow in ${topic}.`,
      `Option C: Generates unhandled promise rejection under heavy concurrent requests.`,
      `Option D: Evaluates to undefined due to scope hoisting in ${topic}.`,
    ];

    questions.push({
      id: `${techId}-${i}`,
      techId,
      techName,
      topic,
      difficulty,
      type: isCodeQuestion ? 'code_output' : 'mcq',
      questionText,
      codeSnippet,
      options,
      correctAnswer: options[0],
      explanation: `In ${techName}, ${topic} utilizes high-performance non-blocking pipelines with defensive error handling to maintain system responsiveness.`,
    });
  }

  return questions;
}

export const QUESTION_BANK: Question[] = TECHNOLOGY_PACKS.flatMap((tech) =>
  generate70QuestionsForTech(tech.id, tech.name)
);
