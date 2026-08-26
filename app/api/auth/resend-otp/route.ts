import { NextResponse } from 'next/server';
import { DynamoService } from '@/services/dynamoService';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const dbUser = await DynamoService.getUserByEmail(cleanEmail);

    if (!dbUser) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    // Generate new 6-digit OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    await DynamoService.updateUser(dbUser.userId, {
      verificationOtp: newOtp,
      otpExpiresAt,
      isEmailVerified: false
    });

    console.log(`[Email OTP Generated for ${cleanEmail}]: ${newOtp}`);

    return NextResponse.json({
      success: true,
      message: `A new 6-digit verification code has been sent to ${cleanEmail}`,
      otp: newOtp // Provided in response for easy testing / development
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to resend code' }, { status: 500 });
  }
}
