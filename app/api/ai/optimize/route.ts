import { NextResponse } from 'next/server';
import { AIResumeService, extractJDKeywords, extractTargetJobTitle } from '@/services/aiResumeService';
import { ResumeData } from '@/types/resume';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action = 'optimize', resume, targetJobDescription = '', userAnswers = {}, previousScore } = body;

    // 1. Payload validation
    if (!resume || typeof resume !== 'object') {
      return NextResponse.json({ error: 'Valid resume data is required' }, { status: 400 });
    }

    if (typeof targetJobDescription !== 'string') {
      return NextResponse.json({ error: 'Job description must be text' }, { status: 400 });
    }

    // Limit JD size to prevent memory abuse (30k chars max)
    const sanitizedJD = targetJobDescription.slice(0, 30000).trim();

    // 2. Action: calculate score only
    if (action === 'analyze') {
      const atsScore = AIResumeService.calculateATSScore(resume as ResumeData, sanitizedJD, previousScore);
      return NextResponse.json({
        success: true,
        atsScore,
      });
    }

    // 3. Action: full optimization
    const jdKeywords = extractJDKeywords(sanitizedJD);
    const targetTitle = extractTargetJobTitle(sanitizedJD);
    const atsScore = AIResumeService.calculateATSScore(resume as ResumeData, sanitizedJD, previousScore);

    const apiKey = process.env.GEMINI_API_KEY;

    // If Gemini API Key is available on server, attempt AI-guided enrichment
    if (apiKey && sanitizedJD.length > 20) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout safeguard

        const prompt = `You are a Senior ATS Optimization Specialist. Given the following resume and target job description, generate an optimized draft.
CRITICAL RULES:
1. NEVER fabricate fake company names, dates, degrees, certifications, or fictional metrics.
2. Only rewrite existing bullet points for strong action verbs, ATS keyword density, and clarity.
3. Tailor the professional summary to the role "${targetTitle || 'Software Engineer'}" using genuine skills.
4. Return ONLY valid raw JSON matching this schema, with no markdown code blocks or commentary:

{
  "summary": "Optimized summary text",
  "bulletImprovements": [
    {
      "experienceId": "exp-id",
      "bulletIndex": 0,
      "original": "old text",
      "improved": "new text",
      "reason": "reason for change",
      "relatedRequirement": "keyword or requirement"
    }
  ]
}

RESUME SUMMARY: "${(resume as ResumeData).contact?.summary || ''}"
RESUME EXPERIENCE BULLETS:
${(resume as ResumeData).experience?.map((e: any) => `ID: ${e.id} | Role: ${e.position} @ ${e.company}\n` + e.highlights.map((h: string, i: number) => `[${i}] ${h}`).join('\n')).join('\n\n')}

TARGET JOB DESCRIPTION:
${sanitizedJD.slice(0, 3000)}`;

        const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const aiRes = await fetch(geminiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const rawText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(rawText.replace(/```json|```/g, '').trim());
            // Combine with deterministic generator for safety & completeness
            const deterministicDraft = AIResumeService.generateDeterministicDraft(
              resume as ResumeData,
              sanitizedJD,
              jdKeywords,
              targetTitle,
              atsScore,
              userAnswers
            );

            // If Gemini produced a valid summary, use it
            if (parsed.summary && typeof parsed.summary === 'string' && parsed.summary.length > 30) {
              const summaryChange = deterministicDraft.changes.find(c => c.section === 'summary');
              if (summaryChange) {
                summaryChange.optimizedText = parsed.summary.trim();
              }
              deterministicDraft.optimizedResume.contact.summary = parsed.summary.trim();
            }

            // If Gemini produced valid bullet improvements, integrate them
            if (Array.isArray(parsed.bulletImprovements)) {
              for (const imp of parsed.bulletImprovements) {
                if (imp.improved && typeof imp.improved === 'string' && imp.improved.length > 20) {
                  const targetChange = deterministicDraft.changes.find(
                    c => c.section === 'experience' && c.targetId === imp.experienceId && c.bulletIndex === imp.bulletIndex
                  );
                  if (targetChange) {
                    targetChange.optimizedText = imp.improved.trim();
                    if (imp.reason) targetChange.reason = imp.reason;
                  }
                  const expIdx = deterministicDraft.optimizedResume.experience.findIndex(e => e.id === imp.experienceId);
                  if (expIdx >= 0 && deterministicDraft.optimizedResume.experience[expIdx].highlights[imp.bulletIndex] !== undefined) {
                    deterministicDraft.optimizedResume.experience[expIdx].highlights[imp.bulletIndex] = imp.improved.trim();
                  }
                }
              }
            }

            return NextResponse.json({
              success: true,
              draft: deterministicDraft,
              atsScore,
            });
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini optimization timed out or failed, using robust fallback engine:', geminiErr);
      }
    }

    // High-performance deterministic engine
    const draft = AIResumeService.generateDeterministicDraft(
      resume as ResumeData,
      sanitizedJD,
      jdKeywords,
      targetTitle,
      atsScore,
      userAnswers
    );

    return NextResponse.json({
      success: true,
      draft,
      atsScore,
    });
  } catch (err: any) {
    console.error('AI Optimize API error:', err);
    return NextResponse.json(
      { error: err.message || 'An error occurred during ATS optimization.' },
      { status: 500 }
    );
  }
}
