'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ShieldCheck,
  CreditCard,
  QrCode,
  Building2,
  Lock,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  Smartphone,
  ExternalLink,
  Loader2,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { RazorpayApiService } from '@/services/razorpayService';


function PaymentGatewayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get('orderId') || `order_${Date.now()}`;
  const amount = Number(searchParams.get('amount')) || 50;


  const currency = searchParams.get('currency') || 'INR';
  const itemId = searchParams.get('itemId') || 'template_default';
  const itemName = searchParams.get('itemName') || 'Resume Template';
  const itemDescription = searchParams.get('itemDescription') || 'Lifetime template access & export';
  const type = searchParams.get('type') || 'template';
  const keyId = searchParams.get('keyId') || 'rzp_test_cvmaker12345';
  const rawRedirectUrl = searchParams.get('redirectUrl') || '';



  const [activeTab, setActiveTab] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [selectedBank, setSelectedBank] = useState('HDFC');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  // Fallback destination URL
  const defaultRedirect =
    type === 'template'
      ? `/resume-builder?unlockedTemplate=${encodeURIComponent(itemId)}&payment=success`
      : `/assessment?passUnlocked=true&payment=success`;

  const finalRedirectUrl = rawRedirectUrl || defaultRedirect;

  const handleCompletePayment = async (methodName: string) => {
    setIsProcessing(true);
    const mockPaymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const mockSignature = `sig_${Date.now()}_valid_hmac`;

    try {
      // 1. Verify payment with backend API
      const verifyRes = await RazorpayApiService.verifyPayment({
        razorpay_payment_id: mockPaymentId,
        razorpay_order_id: orderId,
        razorpay_signature: mockSignature,
        itemId: itemId,
        type: type,
      });

      if (verifyRes.success) {
        setTransactionId(mockPaymentId);
        setPaymentSuccess(true);
        setIsProcessing(false);

        try {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.5 },
          });
        } catch (e) { }

        toast.success(`🎉 Payment of ₹${amount} Successful!`, { duration: 4000 });

        // Persist unlocked template in localStorage directly
        if (typeof window !== 'undefined' && type === 'template' && itemId) {
          try {
            const stored = JSON.parse(localStorage.getItem('unlocked_template_ids') || '[]');
            if (!stored.includes(itemId)) {
              stored.push(itemId);
              localStorage.setItem('unlocked_template_ids', JSON.stringify(stored));
            }
          } catch (e) { }
        }

        // Auto-redirect after short countdown
        setTimeout(() => {
          router.push(finalRedirectUrl);
        }, 1800);
      } else {
        throw new Error(verifyRes.message || 'Payment signature verification failed.');
      }
    } catch (err: any) {
      setIsProcessing(false);
      toast.error(err.message || 'Payment processing failed. Please try again.');
    }
  };

  const fillTestCard = () => {
    setCardNumber('4111 2222 3333 4444');
    setCardExpiry('12/28');
    setCardCvv('789');
    setCardName('Alex Candidate');
    toast.success('Test card autofilled!');
  };

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-emerald-500/40 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden animate-fadeIn">
          <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          </div>

          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Razorpay Verified</span>
          </div>

          <h2 className="text-2xl font-black text-white mb-2">Payment Successful!</h2>
          <p className="text-sm text-slate-300 mb-6">
            You have successfully unlocked <span className="font-bold text-emerald-400">{itemName}</span> for ₹{amount}.
          </p>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-left text-xs space-y-2 mb-6 font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Order ID:</span>
              <span className="text-slate-200">{orderId}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Payment ID:</span>
              <span className="text-emerald-400">{transactionId}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Amount Paid:</span>
              <span className="text-white font-bold">₹{amount}.00 {currency}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Status:</span>
              <span className="text-emerald-400 font-bold">CAPTURED / UNLOCKED</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push(finalRedirectUrl)}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2"
            >
              <span>Return to {type === 'template' ? 'Resume Builder' : 'Assessment Arena'}</span>
              <ExternalLink className="w-4 h-4" />
            </button>
            <p className="text-xs text-slate-500 flex items-center justify-center space-x-1">
              <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />
              <span>Redirecting you automatically in a moment...</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Bar */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between pb-6 border-b border-slate-800">
        <button
          onClick={() => router.push(type === 'template' ? '/resume-builder' : '/assessment')}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Cancel and return</span>
        </button>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>256-Bit SSL Secured</span>
          </div>
          <div className="hidden sm:flex items-center space-x-1 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-400">
            <span>Razorpay Gateway</span>
          </div>
        </div>
      </div>

      {/* Main Payment Container */}
      <div className="max-w-4xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto py-8 items-start">
        {/* Left Column: Order Summary */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center space-x-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-extrabold text-blue-400">Resume Architect AI</p>
                <h3 className="text-base font-extrabold text-white">Order Checkout</h3>
              </div>
            </div>

            <div className="border-t border-b border-slate-800 py-4 my-4 space-y-3">
              <div>
                <span className="text-xs text-slate-400">Product</span>
                <p className="text-sm font-bold text-white mt-0.5">{itemName}</p>
                <p className="text-xs text-slate-400 mt-0.5">{itemDescription}</p>
              </div>

              <div className="flex justify-between text-xs pt-2">
                <span className="text-slate-400">Item ID</span>
                <span className="font-mono text-slate-300">{itemId}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Access Duration</span>
                <span className="text-emerald-400 font-bold">Lifetime Unlimited</span>
              </div>
            </div>

            <div className="space-y-2 pt-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="text-slate-200">₹{amount}.00</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Platform GST / Tax (18%)</span>
                <span className="text-emerald-400 font-semibold">₹0.00 (Waived)</span>
              </div>
              <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-800">
                <span>Total Amount</span>
                <span className="text-blue-400 text-lg">₹{amount}.00</span>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 flex items-center space-x-3 text-xs text-slate-400">
            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p>
              Protected by Razorpay standard encryption. Unlocked templates immediately save to your profile.
            </p>
          </div>
        </div>

        {/* Right Column: Payment Gateway Tabs */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
          <div className="flex items-center justify-between pb-5 border-b border-slate-800 mb-6">
            <div>
              <h2 className="text-lg font-extrabold text-white">Select Payment Method</h2>
              <p className="text-xs text-slate-400">Complete checkout via official test gateway</p>
            </div>
            <div className="px-3 py-1 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-black text-sm">
              ₹{amount}
            </div>
          </div>

          {/* Payment Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-950 border border-slate-800 rounded-2xl mb-6">
            <button
              onClick={() => setActiveTab('upi')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${activeTab === 'upi'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
            >
              <QrCode className="w-4 h-4" />
              <span>UPI / QR</span>
            </button>
            <button
              onClick={() => setActiveTab('card')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${activeTab === 'card'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Card</span>
            </button>
            <button
              onClick={() => setActiveTab('netbanking')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${activeTab === 'netbanking'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
            >
              <Building2 className="w-4 h-4" />
              <span>NetBanking</span>
            </button>
          </div>

          {/* Tab 1: UPI & QR */}
          {activeTab === 'upi' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                {/* Simulated QR Code */}
                <div className="p-3 bg-white rounded-xl shadow-md flex flex-col items-center justify-center">
                  <div className="w-32 h-32 bg-slate-900 rounded-lg flex flex-col items-center justify-center p-2 relative overflow-hidden text-center">
                    <QrCode className="w-20 h-20 text-white opacity-90" />
                    <span className="text-[9px] font-black text-blue-400 tracking-wider mt-1">RAZORPAY UPI</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-800 mt-1">Scan & Pay ₹{amount}</span>
                </div>

                <div className="space-y-2 flex-1 text-center sm:text-left">
                  <span className="text-xs font-bold text-slate-300">Supported UPI Apps</span>
                  <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                    {['Google Pay', 'PhonePe', 'Paytm', 'Cred', 'BHIM'].map((app) => (
                      <span
                        key={app}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-semibold text-slate-300"
                      >
                        {app}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Scan with any UPI app or enter your VPA / UPI ID below to complete the payment.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Enter UPI ID / VPA</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="yourname@okaxis or 9876543210@paytm"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                  <button
                    onClick={() => setUpiId('candidate@razorpay')}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-300 rounded-xl transition-all"
                  >
                    Use Sample ID
                  </button>
                </div>
              </div>

              <button
                disabled={isProcessing}
                onClick={() => handleCompletePayment('UPI')}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying with Razorpay...</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="w-4 h-4" />
                    <span>Pay ₹{amount}.00 via UPI</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Tab 2: Credit / Debit Card */}
          {activeTab === 'card' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-400">Card Details</span>
                <button
                  onClick={fillTestCard}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 underline"
                >
                  Autofill Test Card
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Card Number</label>
                <input
                  type="text"
                  placeholder="4111 2222 3333 4444"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Expiry (MM/YY)</label>
                  <input
                    type="text"
                    placeholder="12/28"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">CVV / CVC</label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="123"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Cardholder Name</label>
                <input
                  type="text"
                  placeholder="Full Name as on Card"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              <button
                disabled={isProcessing}
                onClick={() => handleCompletePayment('Card')}
                className="w-full py-3.5 mt-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Card Payment...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Pay ₹{amount}.00 via Card</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Tab 3: NetBanking */}
          {activeTab === 'netbanking' && (
            <div className="space-y-4 animate-fadeIn">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Select Bank</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {['HDFC', 'ICICI', 'SBI', 'Axis Bank', 'Kotak', 'PNB'].map((bank) => (
                  <button
                    key={bank}
                    onClick={() => setSelectedBank(bank)}
                    className={`py-3 px-3 rounded-xl text-xs font-bold border transition-all text-center ${selectedBank === bank
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                  >
                    {bank}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <button
                  disabled={isProcessing}
                  onClick={() => handleCompletePayment(`NetBanking (${selectedBank})`)}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Redirecting to {selectedBank}...</span>
                    </>
                  ) : (
                    <>
                      <Building2 className="w-4 h-4" />
                      <span>Pay ₹{amount}.00 via {selectedBank} NetBanking</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Quick Sandbox Simulation Trigger */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Developer / Sandbox Test Mode:</span>
            <button
              onClick={() => handleCompletePayment('1-Click Sandbox Pay')}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-extrabold transition-all flex items-center space-x-1 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instant Test Pay (₹{amount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl w-full mx-auto text-center text-slate-600 text-xs py-4 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© 2026 Resume Architect AI Platform • Secure Razorpay Payment Gateway</p>
        <p className="flex items-center space-x-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 inline" />
          <span>PCI-DSS Level 1 Compliant</span>
        </p>
      </div>
    </div>
  );
}

export default function PaymentGatewayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <PaymentGatewayContent />
    </Suspense>
  );
}
