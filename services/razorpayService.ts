export interface InitiatePaymentParams {
  amount: number; // in INR
  currency?: string;
  itemId: string;
  itemName?: string;
  itemDescription?: string;
  type: 'template' | 'mock_test_pass';
  userEmail?: string;
  userName?: string;
  redirectUrl?: string;
}

export interface InitiatePaymentResponse {
  success: boolean;
  orderId: string;
  keyId: string;
  amount: number; // in paise
  amountInINR: number;
  currency: string;
  itemId: string;
  itemName: string;
  itemDescription?: string;
  type: string;
  paymentGatewayUrl: string;
  redirectUrl?: string;
}

export interface CreateOrderParams {
  amount: number; // in INR
  currency?: string;
  itemId: string;
  itemName?: string;
  itemDescription?: string;
  type: 'template' | 'mock_test_pass';
  redirectUrl?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  orderId: string;
  keyId: string;
  amount: number; // in paise
  currency: string;
  itemId: string;
  itemName?: string;
  type: string;
  paymentGatewayUrl?: string;
}

export interface VerifyPaymentParams {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  itemId: string;
  type: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  unlockedItemId?: string;
  orderId?: string;
  paymentId?: string;
  type?: string;
}

export class RazorpayApiService {
  /**
   * 1. Call Backend API to initiate payment and get the Payment Gateway URL
   */
  static async initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResponse> {
    const response = await fetch('/api/razorpay/initiate-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Failed to initiate payment on server');
    }

    return response.json();
  }

  /**
   * 2. Call Backend API to create order via Razorpay Node SDK
   */
  static async createOrder(params: CreateOrderParams): Promise<CreateOrderResponse> {
    const response = await fetch('/api/razorpay/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Failed to create order on server');
    }

    return response.json();
  }

  /**
   * 3. Call Backend API to verify HMAC payment signature
   */
  static async verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResponse> {
    const response = await fetch('/api/razorpay/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || 'Payment signature verification failed');
    }

    return response.json();
  }
}
