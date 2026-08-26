import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { DynamoService } from '@/services/dynamoService';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'cv_architect_super_secret_jwt_key_2026_prod';

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and 6-digit verification code are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = String(otp).trim();

    const dbUser = await DynamoService.getUserByEmail(cleanEmail);
    if (!dbUser) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    // Check if already verified
    if (dbUser.isEmailVerified && !dbUser.verificationOtp) {
      const token = jwt.sign(
        { id: dbUser.userId, email: dbUser.email, name: dbUser.name, role: dbUser.role || 'candidate' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      const response = NextResponse.json({
        success: true,
        message: 'Email is already verified',
        user: {
          id: dbUser.userId,
          userId: dbUser.userId,
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role || 'candidate',
          isEmailVerified: true,
          unlockedTemplates: dbUser.unlockedTemplates || [],
          hasTestPass: Boolean(dbUser.hasTestPass)
        },
        token
      });
      response.cookies.set('cv_token', token, { httpOnly: true, path: '/' });
      return response;
    }

    // Validate OTP
    if (!dbUser.verificationOtp || dbUser.verificationOtp !== cleanOtp) {
      return NextResponse.json({ error: 'Invalid verification code. Please check and try again.' }, { status: 400 });
    }

    // Check Expiration
    if (dbUser.otpExpiresAt && Date.now() > Number(dbUser.otpExpiresAt)) {
      return NextResponse.json({ error: 'Verification code has expired. Please request a new one.' }, { status: 400 });
    }

    // Update DynamoDB user record to verified
    await DynamoService.updateUser(dbUser.userId, {
      isEmailVerified: true,
      verificationOtp: '',
      otpExpiresAt: 0
    });

    const token = jwt.sign(
      { id: dbUser.userId, email: dbUser.email, name: dbUser.name, role: dbUser.role || 'candidate' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({
      success: true,
      message: '🎉 Email verified successfully! You are now logged in.',
      user: {
        id: dbUser.userId,
        userId: dbUser.userId,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role || 'candidate',
        isEmailVerified: true,
        rankTitle: dbUser.rankTitle || '🌱 Associate Engineer',
        highestScore: dbUser.highestScore ?? 0,
        testsTaken: dbUser.testsTaken ?? 0,
        unlockedTemplates: dbUser.unlockedTemplates || ['corporate-clean', 'modern-tech-pro'],
        hasTestPass: Boolean(dbUser.hasTestPass),
        createdAt: dbUser.createdAt
      },
      token
    });

    response.cookies.set('cv_token', token, { httpOnly: true, path: '/' });
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Verification failed' }, { status: 500 });
  }
}
