import { NextResponse } from 'next/server';
import { AIResumeService } from '@/services/aiResumeService';

export async function POST(req: Request) {
  try {
    const { resume, targetJobDescription } = await req.json();
    if (!resume) {
      return NextResponse.json({ error: 'Resume data required' }, { status: 400 });
    }

    const atsScore = AIResumeService.calculateATSScore(resume, targetJobDescription);

    return NextResponse.json({
      success: true,
      atsScore,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Optimization failed' }, { status: 500 });
  }
}
