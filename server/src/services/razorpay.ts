import crypto from 'crypto';

export type PaymentVerificationData = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  bookingId?: string;
};

type CreateOrderArgs = {
  amount: number;
  receipt: string;
  currency?: string;
  notes?: Record<string, string>;
};

type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  notes: Record<string, string>;
  status: string;
};

const RAZORPAY_API_BASE = 'https://api.razorpay.com/v1';
const DEMO_SIGNATURE = 'quickcourt_demo_signature';

function getKeyId() {
  return process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
}

function getKeySecret() {
  return process.env.RAZORPAY_KEY_SECRET || '';
}

function getWebhookSecret() {
  return process.env.RAZORPAY_WEBHOOK_SECRET || '';
}

function authHeader() {
  return `Basic ${Buffer.from(`${getKeyId()}:${getKeySecret()}`).toString('base64')}`;
}

async function razorpayRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${RAZORPAY_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
      ...(init.headers || {})
    }
  });

  const payload: any = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.description || payload?.message || 'Razorpay request failed';
    throw new Error(message);
  }
  return payload as T;
}

export class RazorpayService {
  static isConfigured() {
    return Boolean(getKeyId() && getKeySecret());
  }

  static isDemoOrder(orderId: string) {
    return orderId.startsWith('order_demo_');
  }

  static rupeesToPaise(amount: number) {
    return Math.round(amount * 100);
  }

  static paiseToRupees(amount: number) {
    return amount / 100;
  }

  static getPublicConfig() {
    return {
      keyId: getKeyId(),
      demoMode: !this.isConfigured()
    };
  }

  static generateReceiptId(prefix: string) {
    const rand = Math.random().toString(36).slice(2, 8);
    const ts = Date.now().toString(36);
    return `${prefix}_${ts}_${rand}`;
  }

  static async createOrder(args: CreateOrderArgs): Promise<RazorpayOrder> {
    if (!this.isConfigured()) {
      return {
        id: `order_demo_${this.generateReceiptId('quickcourt')}`,
        amount: args.amount,
        currency: args.currency ?? 'INR',
        receipt: args.receipt,
        notes: args.notes ?? {},
        status: 'created'
      };
    }

    return razorpayRequest<RazorpayOrder>('/orders', {
      method: 'POST',
      body: JSON.stringify({
        amount: args.amount,
        currency: args.currency ?? 'INR',
        receipt: args.receipt,
        notes: args.notes ?? {}
      })
    });
  }

  static verifyPaymentSignature(data: PaymentVerificationData) {
    if (!this.isConfigured()) {
      return this.isDemoOrder(data.razorpay_order_id) && data.razorpay_signature === DEMO_SIGNATURE;
    }

    const expected = crypto
      .createHmac('sha256', getKeySecret())
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest('hex');

    const actual = Buffer.from(data.razorpay_signature);
    const expectedBuffer = Buffer.from(expected);
    return actual.length === expectedBuffer.length && crypto.timingSafeEqual(expectedBuffer, actual);
  }

  static async getPayment(paymentId: string) {
    if (!this.isConfigured() || paymentId.startsWith('pay_demo_')) {
      return { status: 'captured' as const };
    }

    return razorpayRequest<{ status: string }>(`/payments/${paymentId}`);
  }

  static async initiateRefund(paymentId: string, amount?: number, notes?: Record<string, string>) {
    if (!this.isConfigured() || paymentId.startsWith('pay_demo_')) {
      return {
        id: this.generateReceiptId('refund_demo'),
        amount: amount ?? 0,
        status: 'processed'
      };
    }

    return razorpayRequest<{ id: string; amount: number; status: string }>(`/payments/${paymentId}/refund`, {
      method: 'POST',
      body: JSON.stringify({
        ...(amount ? { amount } : {}),
        notes: notes ?? {}
      })
    });
  }

  static verifyWebhookSignature(body: string, signature: string) {
    const webhookSecret = getWebhookSecret();
    if (!webhookSecret) return false;

    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    const actual = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    return actual.length === expectedBuffer.length && crypto.timingSafeEqual(expectedBuffer, actual);
  }

  static createDemoPaymentPayload(orderId: string) {
    return {
      razorpay_order_id: orderId,
      razorpay_payment_id: `pay_demo_${this.generateReceiptId('quickcourt')}`,
      razorpay_signature: DEMO_SIGNATURE
    };
  }
}
