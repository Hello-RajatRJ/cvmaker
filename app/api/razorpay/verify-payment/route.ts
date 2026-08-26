import { NextResponse } from 'next/server';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { DynamoService } from '@/services/dynamoService';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'cv_architect_super_secret_jwt_key_2026_prod';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      itemId,
      type = 'template',
      amount = type === 'mock_test_pass' ? 199 : 50,
      userId: bodyUserId
    } = body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, message: 'Missing payment parameters' },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      return NextResponse.json(
        { success: false, message: 'Payment verification not configured' },
        { status: 500 }
      );
    }

    // Verify signature using HMAC SHA256
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { success: false, message: 'Payment signature verification failed' },
        { status: 400 }
      );
    }

    // Identify user from auth cookie or payload
    let currentUserId = bodyUserId || 'guest_user';
    try {
      const cookieHeader = req.headers.get('cookie') || '';
      const tokenMatch = cookieHeader.match(/cv_token=([^;]+)/);
      if (tokenMatch) {
        const decoded = jwt.verify(tokenMatch[1], JWT_SECRET) as any;
        if (decoded?.id) currentUserId = decoded.id;
      }
    } catch (_) {}

    // Save transaction to DynamoDB `transactions` table matching schema
    await DynamoService.createTransaction({
      transactionId: razorpay_payment_id,
      userId: currentUserId,
      amount: Number(amount),
      currency: 'INR',
      paymentMethod: 'UPI',
      status: 'SUCCESS',
      itemId: itemId || 'template',
      type: type || 'template',
      orderId: razorpay_order_id,
      createdAt: new Date().toISOString()
    });

    // If registered user, update user profile in DynamoDB `users` table
    if (currentUserId && currentUserId !== 'guest_user') {
      try {
        const existingUser = await DynamoService.getUserById(currentUserId);
        if (existingUser) {
          if (type === 'template' && itemId) {
            const currentTemplates = existingUser.unlockedTemplates || [];
            if (!currentTemplates.includes(itemId)) {
              await DynamoService.updateUser(currentUserId, {
                unlockedTemplates: [...currentTemplates, itemId]
              });
            }
          } else if (type === 'mock_test_pass') {
            await DynamoService.updateUser(currentUserId, {
              hasTestPass: true
            });
          }
        }
      } catch (userUpdateErr) {
        console.warn('[DynamoDB user update warning]:', userUpdateErr);
      }
    }

    return NextResponse.json({
      success: true,
      message:
        type === 'template'
          ? `Template ${itemId} unlocked successfully!`
          : 'Access Pass Unlocked!',
      unlockedItemId: itemId,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      transactionId: razorpay_payment_id,
      userId: currentUserId,
      amount,
      type
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}
