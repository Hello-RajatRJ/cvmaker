import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { DynamoService } from '@/services/dynamoService';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'cv_architect_super_secret_jwt_key_2026_prod';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const dbUser = await DynamoService.getUserByEmail(cleanEmail);

    if (!dbUser) {
      return NextResponse.json({ error: 'No account found with this email' }, { status: 404 });
    }

    const storedPass = dbUser.password || dbUser.passwordHash;
    if (storedPass) {
      let isValid = false;
      if (storedPass.startsWith('$2a$') || storedPass.startsWith('$2b$')) {
        isValid = await bcrypt.compare(password, storedPass);
      } else {
        isValid = storedPass === password;
      }

      if (!isValid) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }
    }

    // Check if email is verified
    if (dbUser.isEmailVerified === false) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = Date.now() + 15 * 60 * 1000;
      await DynamoService.updateUser(dbUser.userId, {
        verificationOtp: otp,
        otpExpiresAt
      });

      return NextResponse.json({
        success: false,
        requireVerification: true,
        email: cleanEmail,
        otp,
        error: 'Please verify your email address before signing in.'
      }, { status: 403 });
    }

    const userId = dbUser.userId;
    const userName = dbUser.name || cleanEmail.split('@')[0].toUpperCase();

    const userProfile = {
      id: userId,
      userId,
      name: userName,
      email: cleanEmail,
      role: dbUser.role || 'candidate',
      isEmailVerified: true,
      rankTitle: dbUser.rankTitle || '⚡ Senior Engineer',
      highestScore: dbUser.highestScore ?? 88,
      testsTaken: dbUser.testsTaken ?? 3,
      unlockedTemplates: dbUser.unlockedTemplates || [
        'corporate-clean',
        'modern-tech-pro'
      ],
      hasTestPass: Boolean(dbUser.hasTestPass),
      testHistory: dbUser.testHistory || [],
      createdAt: dbUser.createdAt || new Date().toISOString()
    };

    const token = jwt.sign(
      { id: userId, email: cleanEmail, name: userName, role: userProfile.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const response = NextResponse.json({ success: true, user: userProfile, token });
    response.cookies.set('cv_token', token, { httpOnly: true, path: '/', maxAge: 3600 });
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Login failed' }, { status: 500 });
  }
}
