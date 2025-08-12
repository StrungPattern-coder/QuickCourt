import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../config/env.js';

// Initialize Razorpay instance
export const razorpay = new Razorpay({
  key_id: env.razorpayKeyId,
  key_secret: env.razorpayKeySecret,
});

export interface RazorpayOrderOptions {
  amount: number; // Amount in paise
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

export interface PaymentVerificationData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export class RazorpayService {
  /**
   * Create a Razorpay order
   */
  static async createOrder(options: RazorpayOrderOptions): Promise<RazorpayOrder> {
    try {
      const orderData = {
        amount: Math.round(options.amount), // Ensure amount is an integer (paise)
        currency: options.currency || 'INR',
        receipt: options.receipt,
        notes: options.notes || {},
      };

      const order = await razorpay.orders.create(orderData);
      return order as RazorpayOrder;
    } catch (error) {
      console.error('Razorpay order creation failed:', error);
      throw new Error('Failed to create payment order');
    }
  }

  /**
   * Verify Razorpay payment signature
   */
  static verifyPaymentSignature(data: PaymentVerificationData): boolean {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;
      
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', env.razorpayKeySecret)
        .update(body.toString())
        .digest('hex');

      return expectedSignature === razorpay_signature;
    } catch (error) {
      console.error('Payment signature verification failed:', error);
      return false;
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(body: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', env.razorpayWebhookSecret)
        .update(body)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Get payment details
   */
  static async getPayment(paymentId: string) {
    try {
      return await razorpay.payments.fetch(paymentId);
    } catch (error) {
      console.error('Failed to fetch payment details:', error);
      throw new Error('Failed to fetch payment details');
    }
  }

  /**
   * Get order details
   */
  static async getOrder(orderId: string) {
    try {
      return await razorpay.orders.fetch(orderId);
    } catch (error) {
      console.error('Failed to fetch order details:', error);
      throw new Error('Failed to fetch order details');
    }
  }

  /**
   * Initiate refund
   */
  static async initiateRefund(paymentId: string, amount?: number, notes?: Record<string, string>) {
    try {
      const refundData: any = {
        speed: 'normal', // Can be 'normal' or 'optimum'
        notes: notes || {},
      };

      if (amount) {
        refundData.amount = Math.round(amount); // Amount in paise
      }

      return await razorpay.payments.refund(paymentId, refundData);
    } catch (error) {
      console.error('Refund initiation failed:', error);
      throw new Error('Failed to initiate refund');
    }
  }

  /**
   * Convert rupees to paise
   */
  static rupeesToPaise(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Convert paise to rupees
   */
  static paiseToRupees(amount: number): number {
    return amount / 100;
  }

  /**
   * Generate receipt ID
   */
  static generateReceiptId(prefix: string = 'booking'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`;
  }
}
