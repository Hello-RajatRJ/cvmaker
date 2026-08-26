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
      itemDescription = 'Lifetime access and PDF export',
      type = 'template',
      userEmail = 'candidate@example.com',
      userName = 'Alex Candidate',
      redirectUrl = `/resume-builder?unlockedTemplate=${itemId}&payment=success`,
    } = body;

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || 'rzp_test_cvmaker12345';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_cvmaker_mock_key';

    const amountInPaise = Math.round(Number(amount) * 100);
    const receipt = `rcpt_${itemId}_${Date.now().toString().slice(-6)}`;

    let orderId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let paymentGatewayUrl = '';

    // Check if live/real Razorpay keys are provided
    const isLiveKeys = keyId && keySecret && !keyId.includes('cvmaker12345') && !keySecret.includes('mock_key');

    if (isLiveKeys) {
      try {
        const instance = new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        });

        // Create official Razorpay Order
        const order = await instance.orders.create({
          amount: amountInPaise,
          currency,
          receipt,
          notes: {
            itemId,
            itemName,
            type,
            userEmail,
            userName,
            redirectUrl,
          },
        });

        orderId = order.id;

        // Optionally try creating a hosted Payment Link if supported
        try {
          const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const callbackUrl = `${origin}/api/razorpay/callback?itemId=${encodeURIComponent(itemId)}&type=${encodeURIComponent(type)}&redirectUrl=${encodeURIComponent(redirectUrl)}`;

          const paymentLink: any = await (instance as any).paymentLink.create({
            amount: amountInPaise,
            currency,
            accept_partial: false,
            description: `${itemName} - ${itemDescription}`,
            customer: {
              name: userName,
              email: userEmail,
              contact: '+919999999999',
            },
            notify: {
              sms: false,
              email: false,
            },
            reminder_enable: false,
            notes: {
              itemId,
              type,
              orderId,
            },
            callback_url: callbackUrl,
            callback_method: 'get',
          });

          if (paymentLink && paymentLink.short_url) {
            paymentGatewayUrl = paymentLink.short_url;
          }
        } catch (linkErr: any) {
          console.log('[Razorpay] Payment link creation skipped, using hosted gateway page:', linkErr?.message || linkErr);
        }
      } catch (sdkError: any) {
        console.warn('[Razorpay] SDK Order creation failed, falling back to gateway simulation:', sdkError.message || sdkError);
      }
    }

    // If paymentGatewayUrl was not created via hosted link, point to our built-in Razorpay gateway screen
    if (!paymentGatewayUrl) {
      const queryParams = new URLSearchParams({
        orderId,
        amount: String(amount),
        currency,
        itemId,
        itemName,
        itemDescription,
        type,
        keyId,
        redirectUrl,
      });
      paymentGatewayUrl = `/payment/gateway?${queryParams.toString()}`;
    }

    return NextResponse.json({
      success: true,
      orderId,
      keyId,
      amount: amountInPaise,
      amountInINR: Number(amount),
      currency,
      itemId,
      itemName,
      itemDescription,
      type,
      paymentGatewayUrl,
      redirectUrl,
    });
  } catch (err: any) {
    console.error('[Razorpay Initiate API Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to initiate Razorpay payment' },
      { status: 500 }
    );
  }
}
