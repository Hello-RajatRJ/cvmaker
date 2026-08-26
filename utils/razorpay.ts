import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface PaymentOptions {
  amountInINR: number;
  itemName: string;
  itemDescription: string;
  itemId: string;
  type: 'template' | 'mock_test_pass';
  userEmail?: string;
  userName?: string;
  redirectUrl?: string;
  mode?: 'redirect' | 'modal';
  onSuccess?: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
    itemId?: string;
  }) => void;
  onFailure?: (error: any) => void;
}

export class RazorpayUtil {
  /**
   * Load the official Razorpay checkout script
   */
  static loadScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') return resolve(false);
      if (window.Razorpay) return resolve(true);

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  /**
   * Full payment flow:
   * 1. Create order via backend API
   * 2. Load Razorpay checkout script
   * 3. Open official Razorpay modal
   * 4. Verify payment signature via backend API
   */
  static async initiatePayment(options: PaymentOptions): Promise<void> {
    const toastId = toast.loading('Setting up payment...');

    try {
      // Step 1: Create order on the backend
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: options.amountInINR,
          currency: 'INR',
          itemId: options.itemId,
          itemName: options.itemName,
          itemDescription: options.itemDescription,
          type: options.type,
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      // Step 2: Load checkout script
      const loaded = await this.loadScript();
      if (!loaded) {
        throw new Error('Payment checkout failed to load. Please try again.');
      }

      toast.dismiss(toastId);

      // Step 3: Open official Razorpay checkout modal
      const rzpOptions = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'CV Maker',
        description: `${options.itemName}`,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          // Step 4: Verify payment signature on the backend
          const verifyToast = toast.loading('Verifying payment...');

          try {
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                itemId: options.itemId,
                type: options.type,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              toast.success(`🎉 Payment successful! ${options.itemName} unlocked.`, {
                id: verifyToast,
                duration: 5000,
              });
              try {
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
              } catch (_) {}
              if (options.onSuccess) {
                options.onSuccess({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  itemId: options.itemId,
                });
              }
            } else {
              toast.error(verifyData.message || 'Payment verification failed.', { id: verifyToast });
              if (options.onFailure) options.onFailure(verifyData);
            }
          } catch (err: any) {
            toast.error(err.message || 'Payment verification failed.', { id: verifyToast });
            if (options.onFailure) options.onFailure(err);
          }
        },
        modal: {
          ondismiss: () => {
            toast.error('Payment cancelled.');
          },
        },
        prefill: {
          name: options.userName || '',
          email: options.userEmail || '',
        },
        theme: {
          color: '#4f46e5',
        },
      };

      const rzp = new window.Razorpay(rzpOptions);
      rzp.open();
    } catch (err: any) {
      toast.dismiss(toastId);
      console.error('[Payment Error]:', err);
      toast.error(err.message || 'Payment failed. Please try again.');
      if (options.onFailure) options.onFailure(err);
    }
  }
}
