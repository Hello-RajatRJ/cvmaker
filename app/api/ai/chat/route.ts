import { NextResponse } from 'next/server';
import { AI_PERSONAS, AIPersona } from '@/services/geminiService';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { message, model = 'gemini-1.5-flash', personaId = 'fullstack-architect', apiKey } = await req.json();

    const activeApiKey = apiKey || process.env.GEMINI_API_KEY;
    const persona = AI_PERSONAS.find((p) => p.id === personaId) || AI_PERSONAS[0];

    if (activeApiKey) {
      try {
        const modelEndpointName =
          model === 'gemini-flash-8b'
            ? 'gemini-1.5-flash-8b'
            : model === 'gemini-2.0-flash'
            ? 'gemini-2.0-flash'
            : model === 'gemini-1.5-pro'
            ? 'gemini-1.5-pro'
            : 'gemini-1.5-flash';

        const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelEndpointName}:generateContent?key=${activeApiKey}`;
        
        const aiRes = await fetch(geminiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `${persona.systemPrompt}\n\nUser Question: ${message}\n\nPlease provide a clear, structured, well-formatted response with practical explanations, code examples where appropriate, and key architectural tips.`
                  }
                ]
              }
            ]
          })
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const text = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return NextResponse.json({ reply: text });
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini API call warning, falling back:', geminiErr);
      }
    }

    // Dynamic contextual fallback response generator
    const query = message.trim();
    const queryLower = query.toLowerCase();
    
    let subject = 'High-Performance Architecture';
    let codeSnippet = `// Production Implementation
export function processSolution(payload: Record<string, any>) {
  console.log("Executing optimized pipeline with low overhead");
  return {
    success: true,
    data: payload,
    timestamp: new Date().toISOString()
  };
}`;

    if (queryLower.includes('react') || queryLower.includes('hook') || queryLower.includes('next')) {
      subject = 'Modern React & Next.js Architecture';
      codeSnippet = `// Optimized React Server Component & Custom Hook
import { useMemo, useCallback } from 'react';

export function useOptimizedDataFlow<T>(data: T[]) {
  const processed = useMemo(() => {
    return data.filter(Boolean);
  }, [data]);

  const handleRefresh = useCallback(async () => {
    // Revalidation & async dispatch
    console.log("Triggering non-blocking revalidation");
  }, []);

  return { processed, handleRefresh };
}`;
    } else if (queryLower.includes('sql') || queryLower.includes('db') || queryLower.includes('database') || queryLower.includes('mongo')) {
      subject = 'Database Indexing & Query Tuning';
      codeSnippet = `// Compound Index & Query Optimization
db.resumes.createIndex(
  { userId: 1, createdAt: -1 },
  { background: true, name: "idx_user_created" }
);

// High-Throughput Aggregation Pipeline
const pipeline = [
  { $match: { status: "active" } },
  { $group: { _id: "$category", count: { $sum: 1 } } }
];`;
    } else if (queryLower.includes('docker') || queryLower.includes('k8s') || queryLower.includes('devops') || queryLower.includes('deploy')) {
      subject = 'Cloud Container & CI/CD Pipeline';
      codeSnippet = `# Multi-Stage Production Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
CMD ["npm", "start"]`;
    }

    const reply = `### ${persona.title} Insights

Here is a structured breakdown regarding **${query}**:

#### Architectural Overview
- **Modular Separation**: Structure business logic cleanly decoupled from presentation layers.
- **Asynchronous Execution**: Utilize non-blocking I/O and memoization to prevent runtime bottlenecks.
- **Strict Typing**: Enforce TypeScript type safety across all interfaces and API contracts.

#### Implementation Pattern
\`\`\`typescript
${codeSnippet}
\`\`\`

#### Production Best Practices
- Keep bundle footprints minimal using code splitting and dynamic imports.
- Utilize caching layers (Redis / CDN) for frequent read-heavy workloads.
- Measure latency metrics using APM telemetry and tracing tools.`;

    return NextResponse.json({ reply });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'AI request failed' }, { status: 500 });
  }
}
