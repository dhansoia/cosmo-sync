export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get('x-razorpay-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  // Verify webhook signature
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');

  if (expected !== sig) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const event = JSON.parse(body) as {
    event: string;
    payload: { payment: { entity: { id: string; order_id: string } } };
  };

  if (event.event === 'payment.captured') {
    const { id: paymentId, order_id: orderId } = event.payload.payment.entity;
    await db.session.updateMany({
      where: { razorpayOrderId: orderId },
      data:  { razorpayPaymentId: paymentId, status: 'PAID' },
    });
  }

  return NextResponse.json({ received: true });
}
