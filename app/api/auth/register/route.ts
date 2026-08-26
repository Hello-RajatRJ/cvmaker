import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { DynamoService } from '@/services/dynamoService';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await DynamoService.getUserByEmail(cleanEmail);
    if (existingUser) {
      // If user exists and is already verified
      if (existingUser.isEmailVerified) {
        return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
      }

      // If user exists but unverified, generate a fresh OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = Date.now() + 15 * 60 * 1000;
      await DynamoService.updateUser(existingUser.userId, {
        verificationOtp: otp,
        otpExpiresAt,
        isEmailVerified: false
      });

      return NextResponse.json({
        success: true,
        requireVerification: true,
        email: cleanEmail,
        otp,
        message: `Account is pending verification. A 6-digit code has been sent to ${cleanEmail}.`
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

    const userProfile = {
      userId,
      name,
      email: cleanEmail,
      password: hashedPassword,
      isEmailVerified: false,
      verificationOtp: otp,
      otpExpiresAt,
      role: 'candidate',
      rankTitle: '🌱 Associate Engineer',
      highestScore: 0,
      testsTaken: 0,
      unlockedTemplates: ['corporate-clean', 'modern-tech-pro'],
      hasTestPass: false,
      testHistory: [],
      createdAt: new Date().toISOString()
    };

    // Save to DynamoDB users table
    await DynamoService.createUser(userProfile);

    console.log(`[Email Verification OTP for ${cleanEmail}]: ${otp}`);

    return NextResponse.json({
      success: true,
      requireVerification: true,
      email: cleanEmail,
      otp, // Provided for instant testing
      message: `Registration initiated! Please enter the 6-digit code sent to ${cleanEmail}.`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Registration failed' }, { status: 500 });
  }
}
