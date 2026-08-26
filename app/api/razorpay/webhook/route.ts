import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_cvmaker_mock_key';

    if (signature && webhookSecret && !webhookSecret.includes('mock_key')) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
      }
    }

    const eventData = JSON.parse(rawBody || '{}');
    const eventType = eventData.event;

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = eventData.payload?.payment?.entity;
      const notes = paymentEntity?.notes || {};
      const itemId = notes.itemId;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;

      console.log(`[Razorpay Webhook] Payment Captured: ${paymentId} for Order: ${orderId}, Item: ${itemId}`);
    }

    return NextResponse.json({ status: 'ok', received: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Webhook processing failed' }, { status: 500 });
  }
}
