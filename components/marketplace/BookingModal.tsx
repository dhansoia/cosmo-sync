'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ExpertPublicProfile } from '@/lib/marketplace/types';

// Razorpay Checkout is loaded from CDN — declare its shape on window
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open(): void };
  }
}

interface RazorpayOptions {
  key:         string;
  amount:      number;
  currency:    string;
  name:        string;
  description: string;
  order_id:    string;
  handler:     (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  prefill?:    { name?: string; email?: string };
  theme?:      { color?: string };
  modal?:      { ondismiss?: () => void };
}

const DURATIONS = [15, 30, 60] as const;
type Duration = (typeof DURATIONS)[number];
type ModalState = 'selecting' | 'processing' | 'verifying' | 'success' | 'error';

interface Props {
  expert:  ExpertPublicProfile;
  onClose: (booked: boolean) => void;
}

// Load Razorpay Checkout script once
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src     = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function BookingModal({ expert, onClose }: Props) {
  const [modalState, setModalState] = useState<ModalState>('selecting');
  const [duration,   setDuration]   = useState<Duration>(30);
  const [errorMsg,   setErrorMsg]   = useState('');

  const total = duration * expert.ratePerMinute;

  const handleConfirm = async () => {
    setModalState('processing');

    // 1. Ensure Razorpay script is loaded
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setErrorMsg('Could not load payment gateway. Check your internet connection.');
      setModalState('error');
      return;
    }

    // 2. Create Razorpay order server-side
    const res = await fetch('/api/sessions', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ expertProfileId: expert.id, durationMinutes: duration }),
    });

    if (!res.ok) {
      const data = await res.json();
      setErrorMsg(data.error ?? 'Failed to create order.');
      setModalState('error');
      return;
    }

    const { orderId, amount, currency, keyId } = await res.json();

    // 3. Open Razorpay Checkout modal
    const rzp = new window.Razorpay({
      key:         keyId,
      amount,
      currency,
      name:        'CosmoSync',
      description: `${duration}-min session with ${expert.displayName}`,
      order_id:    orderId,
      theme:       { color: '#a78bfa' },
      modal:       { ondismiss: () => setModalState('selecting') },
      handler: async (response) => {
        setModalState('verifying');

        // 4. Verify signature server-side
        const vRes = await fetch('/api/sessions/verify', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            razorpayOrderId:   response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          }),
        });

        if (vRes.ok) {
          setModalState('success');
          setTimeout(() => onClose(true), 2000);
        } else {
          const vData = await vRes.json();
          setErrorMsg(vData.error ?? 'Payment verification failed.');
          setModalState('error');
        }
      },
    });

    rzp.open();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md mx-4 rounded-2xl border border-white/10 bg-[#0a0a0f] p-6 flex flex-col gap-5"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-white font-semibold text-lg">Book a Session</h2>
            <p className="text-white/40 text-sm">{expert.displayName}</p>
          </div>
          <button
            onClick={() => onClose(false)}
            className="text-white/30 hover:text-white/60 transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* Selecting duration */}
          {(modalState === 'selecting') && (
            <motion.div
              key="selecting"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col gap-3"
            >
              <p className="text-white/50 text-sm">Choose session length</p>
              {DURATIONS.map((d) => {
                const price    = Math.round(d * expert.ratePerMinute);
                const selected = duration === d;
                return (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`
                      flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all
                      ${selected
                        ? 'border-white/30 bg-white/[0.08] text-white'
                        : 'border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20'}
                    `}
                  >
                    <span className="font-medium">{d} minutes</span>
                    <span className="text-amber-400 font-semibold">₹{price}</span>
                  </button>
                );
              })}
              <button
                onClick={handleConfirm}
                className="w-full py-3 rounded-xl text-sm font-semibold bg-white text-black hover:bg-white/90 active:bg-white/80 transition-colors mt-1"
              >
                Pay ₹{Math.round(total)} via Razorpay
              </button>
              <p className="text-white/20 text-xs text-center">
                UPI · Cards · Net Banking · Google Pay · PhonePe · Paytm
              </p>
            </motion.div>
          )}

          {/* Processing / verifying */}
          {(modalState === 'processing' || modalState === 'verifying') && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3 py-8"
            >
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <p className="text-white/40 text-sm">
                {modalState === 'verifying' ? 'Verifying payment…' : 'Opening payment gateway…'}
              </p>
            </motion.div>
          )}

          {/* Success */}
          {modalState === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 py-6"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center text-3xl text-emerald-400">
                ✓
              </div>
              <p className="text-white font-semibold text-lg">Session booked!</p>
              <p className="text-white/40 text-sm text-center">
                Your {duration}-min session with {expert.displayName} is confirmed.
              </p>
            </motion.div>
          )}

          {/* Error */}
          {modalState === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3 py-4"
            >
              <p className="text-red-400 text-sm text-center">{errorMsg}</p>
              <button
                onClick={() => { setErrorMsg(''); setModalState('selecting'); }}
                className="px-5 py-2 rounded-xl text-sm font-medium border border-white/15 text-white/60 hover:border-white/30 hover:text-white/90 transition-colors"
              >
                Try again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
