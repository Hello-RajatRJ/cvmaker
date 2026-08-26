import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  return handleCallback(req);
}

export async function POST(req: Request) {
  return handleCallback(req);
}

async function handleCallback(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Check parameters from URL (GET) or form/json body (POST)
    let paymentId = searchParams.get('razorpay_payment_id');
    let paymentLinkId = searchParams.get('razorpay_payment_link_id');
    let paymentLinkStatus = searchParams.get('razorpay_payment_link_status');
    let signature = searchParams.get('razorpay_signature');
    let itemId = searchParams.get('itemId') || 'template_default';
    let type = searchParams.get('type') || 'template';
    let redirectUrl = searchParams.get('redirectUrl') || '';

    if (req.method === 'POST') {
      try {
        const bodyText = await req.text();
        const bodyParams = new URLSearchParams(bodyText);
        paymentId = bodyParams.get('razorpay_payment_id') || paymentId;
        paymentLinkId = bodyParams.get('razorpay_payment_link_id') || paymentLinkId;
        paymentLinkStatus = bodyParams.get('razorpay_payment_link_status') || paymentLinkStatus;
        signature = bodyParams.get('razorpay_signature') || signature;
      } catch (e) {}
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_cvmaker_mock_key';

    // Verify signature if provided and real secret is present
    if (paymentLinkId && paymentId && signature && keySecret && !keySecret.includes('mock_key')) {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${paymentLinkId}|${paymentId}`)
        .digest('hex');

      if (generatedSignature !== signature) {
        console.error('[Razorpay Callback] Signature mismatch');
        return NextResponse.redirect(new URL('/resume-builder?payment=failed', req.url));
      }
    }

    // Determine target redirect
    let target = redirectUrl;
    if (!target) {
      if (type === 'template') {
        target = `/resume-builder?unlockedTemplate=${encodeURIComponent(itemId)}&payment=success&paymentId=${encodeURIComponent(paymentId || '')}`;
      } else {
        target = `/assessment?passUnlocked=true&payment=success&paymentId=${encodeURIComponent(paymentId || '')}`;
      }
    } else {
      const separator = target.includes('?') ? '&' : '?';
      target = `${target}${separator}unlockedTemplate=${encodeURIComponent(itemId)}&payment=success&paymentId=${encodeURIComponent(paymentId || '')}`;
    }

    return NextResponse.redirect(new URL(target, req.url));
  } catch (err: any) {
    console.error('[Razorpay Callback Error]:', err);
    return NextResponse.redirect(new URL('/resume-builder?payment=error', req.url));
  }
}
