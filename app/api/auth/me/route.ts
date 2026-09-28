import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { DynamoService } from '@/services/dynamoService';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'cv_architect_super_secret_jwt_key_2026_prod';

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const tokenMatch = cookieHeader.match(/cv_token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const dbUser = decoded.id ? await DynamoService.getUserById(decoded.id) : null;

    return NextResponse.json({
      authenticated: true,
      user: {
        id: decoded.id,
        userId: decoded.id,
        name: dbUser?.name || decoded.name || 'Candidate Architect',
        email: dbUser?.email || decoded.email,
        role: dbUser?.role || decoded.role || 'candidate',
        rankTitle: dbUser?.rankTitle || '🏆 Lead Architect',
        highestScore: dbUser?.highestScore ?? 94,
        testsTaken: dbUser?.testsTaken ?? 5,
        unlockedTemplates: dbUser?.unlockedTemplates || [
          'corporate-clean',
          'modern-tech-pro',
          'compact-one-page',
          'silicon-valley-senior'
        ],
        hasTestPass: dbUser?.hasTestPass ?? true,
        testHistory: dbUser?.testHistory || [],
        createdAt: dbUser?.createdAt
      }
    });
  } catch (err) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
  }
}
