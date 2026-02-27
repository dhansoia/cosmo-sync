import Razorpay from 'razorpay';

const globalForRazorpay = globalThis as unknown as { razorpay?: Razorpay };

export const razorpay: Razorpay =
  globalForRazorpay.razorpay ??
  new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID     || 'rzp_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder',
  });

if (process.env.NODE_ENV !== 'production') {
  globalForRazorpay.razorpay = razorpay;
}
