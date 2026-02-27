export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { razorpay } from '@/lib/razorpay';

const VALID_DURATIONS = [15, 30, 60] as const;
type Duration = (typeof VALID_DURATIONS)[number];

interface SessionBody {
  expertProfileId: string;
  durationMinutes: Duration;
}

export async function POST(req: NextRequest) {
  const uid = cookies().get('cosmo_uid')?.value;
  if (!uid) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  let body: SessionBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { expertProfileId, durationMinutes } = body;

  if (!VALID_DURATIONS.includes(durationMinutes)) {
    return NextResponse.json({ error: 'durationMinutes must be 15, 30, or 60' }, { status: 400 });
  }

  const expert = await db.expertProfile.findUnique({ where: { id: expertProfileId } });
  if (!expert || !expert.payoutsEnabled) {
    return NextResponse.json({ error: 'Expert not available for booking' }, { status: 404 });
  }

  const totalAmount  = durationMinutes * expert.ratePerMinute;   // in INR
  const platformFee  = totalAmount * 0.2;

  // Razorpay amounts are in paise (1 INR = 100 paise)
  const order = await razorpay.orders.create({
    amount:   Math.round(totalAmount * 100),
    currency: 'INR',
    receipt:  `cosmo_${Date.now()}`,
    notes: {
      expertProfileId,
      clientId:        uid,
      durationMinutes: String(durationMinutes),
    },
  });

  const session = await db.session.create({
    data: {
      expertId:       expertProfileId,
      clientId:       uid,
      durationMinutes,
      ratePerMinute:  expert.ratePerMinute,
      totalAmount,
      platformFee,
      razorpayOrderId: order.id,
      status:          'PENDING',
    },
  });

  return NextResponse.json({
    orderId:     order.id,
    amount:      order.amount,    // paise — Razorpay Checkout expects paise
    currency:    'INR',
    keyId:       process.env.RAZORPAY_KEY_ID,
    sessionId:   session.id,
    totalAmount,                  // INR — for display
  });
}
