export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { db } from '@/lib/db';

interface VerifyBody {
  razorpayOrderId:   string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export async function POST(req: NextRequest) {
  const uid = cookies().get('cosmo_uid')?.value;
  if (!uid) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  let body: VerifyBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

  // Verify HMAC-SHA256 signature
  // Razorpay signs: "<orderId>|<paymentId>" with your key secret
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
  }

  // Mark session PAID
  const updated = await db.session.updateMany({
    where:  { razorpayOrderId, clientId: uid },
    data:   { razorpayPaymentId, status: 'PAID' },
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
