import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      amount = 50,
      currency = 'INR',
      itemId = 'template_default',
      itemName = 'Resume Template',
      itemDescription = 'Lifetime access and export',
      type = 'template',
    } = body;

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: 'Payment gateway is not configured. Please set NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.' },
        { status: 500 }
      );
    }

    const amountInPaise = Math.round(Number(amount) * 100);

    const instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const order = await instance.orders.create({
      amount: amountInPaise,
      currency,
      receipt: `rcpt_${itemId}_${Date.now().toString().slice(-6)}`,
      notes: {
        itemId: itemId || 'template',
        type: type || 'template',
        itemName,
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      keyId,
      amount: order.amount,
      currency: order.currency,
      itemId,
      itemName,
      type,
    });
  } catch (err: any) {
    console.error('[create-order] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
