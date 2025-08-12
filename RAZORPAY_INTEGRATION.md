# Razorpay Integration Documentation

## Overview

This document outlines the complete Razorpay payment gateway integration for QuickCourt - a production-ready implementation with comprehensive error handling, security measures, and webhook support.

## Architecture

### Backend Integration

1. **Payment Service** (`server/src/services/razorpay.ts`)
   - Razorpay SDK initialization
   - Order creation and verification
   - Payment signature validation
   - Webhook signature verification
   - Refund processing
   - Utility functions for currency conversion

2. **Payment Controller** (`server/src/modules/payment/payment.controller.ts`)
   - RESTful API endpoints for payment operations
   - Database integration with Prisma
   - Transaction management
   - Error handling and validation

3. **Payment Routes** (`server/src/modules/payment/payment.routes.ts`)
   - `/payments/orders` - Create Razorpay order
   - `/payments/verify` - Verify payment signature
   - `/payments/booking/:bookingId/status` - Get payment status
   - `/payments/refund` - Initiate refund
   - `/payments/webhook` - Handle Razorpay webhooks

### Frontend Integration

1. **Payment Hook** (`src/hooks/useRazorpayPayment.ts`)
   - Razorpay SDK loading and initialization
   - Payment processing with UI integration
   - Error handling and state management
   - Payment status tracking

2. **Payment Components**
   - `PaymentModal.tsx` - Payment confirmation modal
   - `BookingSuccess.tsx` - Success confirmation screen
   - `BookingPageNew.tsx` - Enhanced booking flow

## Setup Instructions

### 1. Backend Setup

1. **Install Dependencies**
   ```bash
   cd server
   npm install razorpay
   ```

2. **Environment Configuration**
   Add to `server/.env`:
   ```bash
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
   ```

3. **Database Schema**
   The Payment table is already configured in Prisma schema:
   ```prisma
   model Payment {
     id            String        @id @default(cuid())
     booking       Booking       @relation(fields: [bookingId], references: [id])
     bookingId     String        @unique
     amount        Decimal       @db.Decimal(10,2)
     provider      String
     providerRef   String?
     status        PaymentStatus @default(PENDING)
     createdAt     DateTime      @default(now())
     updatedAt     DateTime      @updatedAt
     @@index([status])
   }
   ```

### 2. Frontend Setup

1. **Install Dependencies**
   ```bash
   npm install razorpay
   ```

2. **Environment Configuration**
   Add to `.env`:
   ```bash
   VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
   ```

### 3. Razorpay Dashboard Configuration

1. **Create Account**
   - Sign up at https://dashboard.razorpay.com/
   - Complete KYC verification
   - Get your Key ID and Key Secret from Settings > API Keys

2. **Webhook Configuration**
   - Go to Settings > Webhooks
   - Add webhook URL: `https://your-domain.com/payments/webhook`
   - Select events:
     - `payment.captured`
     - `payment.failed`
     - `order.paid`
     - `refund.processed`
   - Copy the webhook secret

3. **Payment Methods**
   - Enable desired payment methods in Dashboard
   - Configure auto-capture or manual capture
   - Set up settlement schedule

## Flow Diagram

```
User Booking Flow:
1. User selects venue, court, and time slot
2. BookingPageNew creates booking with PENDING status
3. PaymentModal opens with booking details
4. Frontend creates Razorpay order via API
5. Razorpay checkout opens
6. User completes payment
7. Frontend verifies payment signature
8. Backend updates booking to CONFIRMED
9. BookingSuccess modal shows confirmation

Webhook Flow:
1. Razorpay sends webhook to /payments/webhook
2. Backend verifies webhook signature
3. Updates payment and booking status
4. Logs event for monitoring
```

## API Endpoints

### POST `/payments/orders`
Create a Razorpay order for a booking.

**Request:**
```json
{
  "bookingId": "booking_id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "order_xyz",
    "amount": 50000,
    "currency": "INR",
    "booking": {
      "id": "booking_id",
      "facilityName": "SBR Badminton",
      "courtName": "Court 1",
      "startTime": "2025-08-12T09:00:00.000Z",
      "endTime": "2025-08-12T10:00:00.000Z",
      "price": "500.00"
    }
  }
}
```

### POST `/payments/verify`
Verify payment signature after successful payment.

**Request:**
```json
{
  "razorpay_order_id": "order_xyz",
  "razorpay_payment_id": "pay_xyz",
  "razorpay_signature": "signature_hash",
  "bookingId": "booking_id"
}
```

### GET `/payments/booking/:bookingId/status`
Get payment status for a booking.

### POST `/payments/refund`
Initiate refund for a payment.

**Request:**
```json
{
  "paymentId": "payment_id",
  "reason": "User cancellation",
  "amount": 50000  // Optional, full refund if not provided
}
```

### POST `/payments/webhook`
Handle Razorpay webhook events (no authentication required).

## Security Features

1. **Signature Verification**
   - All payments verified using HMAC SHA256
   - Webhook signatures validated
   - Payment amounts cross-checked

2. **Data Validation**
   - Zod schemas for request validation
   - SQL injection prevention via Prisma
   - Rate limiting on payment endpoints

3. **Error Handling**
   - Comprehensive error messages
   - Transaction rollbacks on failures
   - Audit logging for all payment events

4. **CORS Configuration**
   - Restricted origins for API calls
   - Secure cookie handling
   - CSRF protection

## Testing

### Test Mode Setup

1. Use Razorpay test credentials:
   ```bash
   RAZORPAY_KEY_ID=rzp_test_xxxxx
   RAZORPAY_KEY_SECRET=test_secret_key
   ```

2. **Test Cards:**
   - Success: 4111 1111 1111 1111
   - Failure: 4000 0000 0000 0002
   - CVV: Any 3 digits
   - Expiry: Any future date

3. **Test UPI IDs:**
   - Success: success@razorpay
   - Failure: failure@razorpay

### Testing Webhooks

1. Use ngrok for local testing:
   ```bash
   ngrok http 4000
   ```

2. Update webhook URL in Razorpay dashboard to ngrok URL

3. Use Razorpay webhook simulator for testing events

## Production Checklist

- [ ] KYC verification completed on Razorpay
- [ ] Live API keys configured
- [ ] Webhook URLs updated to production
- [ ] SSL certificate installed
- [ ] Rate limiting configured
- [ ] Monitoring and alerting setup
- [ ] Error tracking enabled
- [ ] Database backups configured
- [ ] Log rotation setup
- [ ] Performance testing completed

## Monitoring and Analytics

### Key Metrics to Track

1. **Payment Success Rate**
2. **Average Payment Time**
3. **Failed Payment Reasons**
4. **Refund Processing Time**
5. **Revenue by Payment Method**

### Logging

All payment events are logged with:
- Timestamp
- User ID
- Booking ID
- Amount
- Payment method
- Status
- Error details (if any)

### Alerts

Set up alerts for:
- Payment failure rate > 5%
- Webhook delivery failures
- Unusual refund patterns
- API response time > 2 seconds

## Support and Troubleshooting

### Common Issues

1. **Payment Stuck in Pending**
   - Check webhook delivery
   - Verify signature validation
   - Check database locks

2. **Signature Verification Failed**
   - Verify webhook secret
   - Check body parsing
   - Ensure consistent encoding

3. **Refund Delays**
   - Check Razorpay settlement schedule
   - Verify refund policy settings
   - Contact Razorpay support for bank-specific delays

### Contact Information

- **Razorpay Support:** support@razorpay.com
- **Dashboard:** https://dashboard.razorpay.com/
- **Documentation:** https://razorpay.com/docs/

## Future Enhancements

1. **Multi-currency Support**
2. **Subscription Payments**
3. **EMI Options**
4. **Split Payments** (for commission handling)
5. **Advanced Analytics Dashboard**
6. **Automated Reconciliation**

---

*Last Updated: August 12, 2025*
*Version: 1.0*
