import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RazorpayUtil } from '@/utils/razorpay';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

interface RazorpayButtonProps {
  amount: number; // INR
  itemId: string;
  itemName: string;
  itemDescription?: string;
  type: 'template' | 'mock_test_pass' | any;
  redirectUrl?: string;
}

export default function RazorpayButton({
  amount,
  itemId,
  itemName,
  itemDescription = '',
  type,
  redirectUrl,
}: RazorpayButtonProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = async () => {
    setIsProcessing(true);
    try {
      const response = await RazorpayUtil.initiatePayment({
        amountInINR: amount,
        itemId,
        itemName,
        itemDescription,
        type,
        redirectUrl,
        mode: 'modal', // force modal flow
        onSuccess: async (payload) => {
          // Unlock template locally (mirroring previous logic)
          if (type === 'template') {
            try {
              const stored = JSON.parse(localStorage.getItem('unlocked_template_ids') || '[]');
              if (!stored.includes(itemId)) {
                stored.push(itemId);
                localStorage.setItem('unlocked_template_ids', JSON.stringify(stored));
              }
            } catch (e) { }
          }
          // Show success UI
          toast.success(`🎉 Payment Successful! ${itemName} unlocked.`, { duration: 4000 });
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
          // Redirect after short delay
          setTimeout(() => {
            router.push(redirectUrl || `/resume-builder?unlockedTemplate=${encodeURIComponent(itemId)}&payment=success`);
          }, 1800);
        },
        onFailure: (err) => {
          toast.error(err.message || 'Payment failed');
        },
      });
    } catch (e: any) {
      toast.error(e.message || 'Payment error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button
      disabled={isProcessing}
      onClick={handleClick}
      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
    >
      {isProcessing ? (
        <>
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
            <path d="M22 12a10 10 0 01-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
          <span>Connecting to Razorpay…</span>
        </>
      ) : (
        <>Pay ₹{amount}.00 via Razorpay</>
      )}
    </button>
  );
}
