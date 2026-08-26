export type GeminiModel = 'gemini-1.5-flash' | 'gemini-1.5-pro' | 'gemini-flash-8b' | 'gemini-2.0-flash';

export type AIPersona = 
  | 'interview-coach' 
  | 'fullstack-architect' 
  | 'code-optimizer' 
  | 'resume-reviewer'
  | 'system-designer'
  | 'devops-lead';

export interface PersonaConfig {
  id: AIPersona;
  title: string;
  avatar: string;
  description: string;
  systemPrompt: string;
}

export const AI_PERSONAS: PersonaConfig[] = [
  {
    id: 'interview-coach',
    title: 'Technical Interview Coach',
    avatar: '🎯',
    description: 'Drills deep DSA, system design, and framework questions with constructive feedback.',
    systemPrompt: 'You are an elite Lead FAANG Technical Interview Coach. Ask challenging technical questions, evaluate candidate code for time/space complexity, and offer actionable tips.'
  },
  {
    id: 'fullstack-architect',
    title: 'Full-Stack Architect',
    avatar: '🏛️',
    description: 'Expert guidance on Next.js, Node.js, databases, cloud microservices, and state management.',
    systemPrompt: 'You are a Principal Software Architect. Provide production-ready TypeScript code snippets, clean directory structures, and microservice architecture advice.'
  },
  {
    id: 'code-optimizer',
    title: 'Code Optimizer & Auditor',
    avatar: '⚡',
    description: 'Audits code for memory leaks, performance bottlenecks, and security vulnerabilities.',
    systemPrompt: 'You are a Senior Performance Engineer. Refactor provided code for maximum efficiency, low memory footprint, and high security standards.'
  },
  {
    id: 'resume-reviewer',
    title: 'Executive Resume Reviewer',
    avatar: '📄',
    description: 'Provides high-conversion bullet points, ATS keyword suggestions, and career positioning advice.',
    systemPrompt: 'You are a Tech Executive Career Coach & ATS Specialist. Help candidates craft high-impact quantified resume bullet points and highlight core tech skills.'
  },
  {
    id: 'system-designer',
    title: 'System Design Specialist',
    avatar: '🧠',
    description: 'Architects scalable distributed systems, Redis caching, Kafka message queues, and DB sharding.',
    systemPrompt: 'You are a Principal Distributed Systems Engineer. Explain trade-offs between consistency, availability, partition tolerance (CAP theorem), caching, and database partitioning.'
  },
  {
    id: 'devops-lead',
    title: 'DevOps & Cloud Lead',
    avatar: '🐳',
    description: 'Docker multi-stage builds, Kubernetes manifests, AWS infrastructure, and CI/CD pipelines.',
    systemPrompt: 'You are a Senior DevOps & Cloud Infrastructure Lead. Provide production-grade Dockerfiles, Terraform scripts, GitHub Actions, and Kubernetes YAML configurations.'
  }
];

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  modelUsed?: string;
  personaId?: AIPersona;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
  personaId: AIPersona;
  model: GeminiModel;
}

export class GeminiService {
  /**
   * Send message to API backend route handler or simulate client response fallback
   */
  static async sendMessage(
    message: string,
    model: GeminiModel,
    personaId: AIPersona,
    history: ChatMessage[] = [],
    apiKey?: string
  ): Promise<string> {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, model, personaId, history, apiKey })
      });
      if (response.ok) {
        const data = await response.json();
        return data.reply;
      }
    } catch (err) {
      console.warn('API route fallback:', err);
    }

    // Client fallback mock response when offline or before API key set
    const persona = AI_PERSONAS.find((p) => p.id === personaId) || AI_PERSONAS[0];
    return `### ${persona.title} Technical Response

Here is a recommended approach for **${message.slice(0, 50)}**:

#### Architectural Overview
- **Separation of Concerns**: Keep business logic decoupled from presentation.
- **Optimized Execution**: Leverage async event loops and memoization.
- **Strict Typing**: Use TypeScript for end-to-end interface contracts.

#### Code Implementation
\`\`\`typescript
// Production Pattern: ${persona.title}
export async function executeHighPerformanceTask(input: string): Promise<Record<string, any>> {
  console.log("Processing with low latency:", input);
  return {
    status: "success",
    throughput: "4,200 req/sec",
    timestamp: new Date().toISOString()
  };
}
\`\`\`

#### Best Practices
- Minimize bundle size with code splitting.
- Enforce strict typing with generics.
- Monitor runtime performance metrics.`;
  }
}
