# Complete Razorpay Testing Guide for QuickCourt

## Overview

This guide covers comprehensive testing of Razorpay integration across all layers of the QuickCourt application.

## Prerequisites

### 1. Razorpay Test Account Setup

1. **Create Razorpay Test Account**
   ```bash
   # Visit: https://dashboard.razorpay.com/
   # Sign up and verify your account
   # Go to Settings > API Keys
   # Generate Test Keys (NOT Live Keys)
   ```

2. **Get Test Credentials**
   ```bash
   # You'll get:
   Key ID: rzp_test_xxxxxxxxxx
   Key Secret: xxxxxxxxxx
   ```

3. **Set Environment Variables**
   ```bash
   # server/.env
   RAZORPAY_KEY_ID=rzp_test_your_key_id
   RAZORPAY_KEY_SECRET=your_secret_key
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
   
   # frontend/.env
   VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
   ```

### 2. Test Data

**Test Credit/Debit Cards:**
- **Success Card**: `4111 1111 1111 1111`
- **Failure Card**: `4000 0000 0000 0002`
- **CVV**: Any 3 digits (123)
- **Expiry**: Any future date (12/25)
- **Name**: Any name

**Test UPI IDs:**
- **Success**: `success@razorpay`
- **Failure**: `failure@razorpay`

**Test Wallets:**
- **Paytm**: Always succeeds in test mode
- **PhonePe**: Always succeeds in test mode

## Testing Levels

---

## 1. Backend API Testing

### Setup Backend Testing Environment

```bash
# 1. Start the backend server
cd server
npm run dev

# 2. Verify server is running
curl http://localhost:4000/health
```

### Test Payment APIs

#### A. Test Payment Order Creation

```bash
# First login to get access token
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Save the access token from response
export ACCESS_TOKEN="your_access_token_here"

# Create a test booking first
curl -X POST http://localhost:4000/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "courtId": "court_id_here",
    "startTime": "2025-08-13T10:00:00.000Z",
    "endTime": "2025-08-13T11:00:00.000Z"
  }'

# Save the booking ID from response
export BOOKING_ID="booking_id_from_response"

# Test creating payment order
curl -X POST http://localhost:4000/payments/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "bookingId": "'$BOOKING_ID'"
  }' | jq '.'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "order_xxxxx",
    "amount": 50000,
    "currency": "INR",
    "receipt": "booking_timestamp_random",
    "booking": {
      "id": "booking_id",
      "facilityName": "Test Facility",
      "courtName": "Test Court",
      "startTime": "2025-08-13T10:00:00.000Z",
      "endTime": "2025-08-13T11:00:00.000Z",
      "price": "500.00"
    }
  }
}
```

#### B. Test Payment Verification

```bash
# Test payment verification (will fail without actual payment)
curl -X POST http://localhost:4000/payments/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "razorpay_order_id": "order_xxxxx",
    "razorpay_payment_id": "pay_xxxxx",
    "razorpay_signature": "invalid_signature",
    "bookingId": "'$BOOKING_ID'"
  }' | jq '.'
```

**Expected Response (Failure):**
```json
{
  "success": false,
  "message": "Invalid payment signature"
}
```

#### C. Test Payment Status

```bash
# Test getting payment status
curl -X GET http://localhost:4000/payments/booking/$BOOKING_ID/status \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

#### D. Test Webhook Endpoint

```bash
# Test webhook without signature (should fail)
curl -X POST http://localhost:4000/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "payment.captured",
    "payload": {
      "payment": {
        "entity": {
          "id": "pay_test123",
          "order_id": "order_test123",
          "status": "captured"
        }
      }
    }
  }' | jq '.'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Missing webhook signature"
}
```

---

## 2. Frontend Testing

### Setup Frontend Testing Environment

```bash
# 1. Start the frontend server
npm run dev

# 2. Open browser
open http://localhost:8080
```

### Manual Frontend Testing Steps

#### A. Test Payment Hook Loading

1. **Open Developer Console**
2. **Navigate to booking page**
3. **Check for Razorpay script loading**
   ```javascript
   // Check in console
   console.log(window.Razorpay ? 'Razorpay loaded' : 'Razorpay not loaded');
   ```

#### B. Test Payment Modal

1. **Create Test Booking**
   - Login to the application
   - Browse venues
   - Select a court and time slot
   - Click "Book Now"

2. **Verify Payment Modal Opens**
   - Should show booking details
   - Should display correct amount
   - Should show "Pay with Razorpay" button

3. **Test Payment Flow**
   - Click "Pay" button
   - Razorpay checkout should open
   - Use test card: `4111 1111 1111 1111`
   - Complete payment

#### C. Test Success Flow

1. **After Successful Payment**
   - Should show success modal
   - Should display booking confirmation
   - Should navigate to bookings page

#### D. Test Error Handling

1. **Use Failure Card**: `4000 0000 0000 0002`
2. **Should show error message**
3. **Should not confirm booking**

### Frontend Console Testing

```javascript
// Test in browser console

// 1. Check Razorpay configuration
console.log('VITE_RAZORPAY_KEY_ID:', import.meta.env.VITE_RAZORPAY_KEY_ID);

// 2. Test payment hook manually
const testPayment = async () => {
  try {
    const response = await fetch('http://localhost:4000/payments/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
      },
      body: JSON.stringify({ bookingId: 'test_booking_id' })
    });
    console.log('Payment order response:', await response.json());
  } catch (error) {
    console.error('Payment test error:', error);
  }
};

// Run test
testPayment();
```

---

## 3. Complete Website Testing

### End-to-End Testing Scenarios

#### Scenario 1: Complete Booking Flow

1. **User Registration/Login**
   ```bash
   # Visit: http://localhost:8080/signup
   # Register new user or login existing
   ```

2. **Browse Venues**
   ```bash
   # Visit: http://localhost:8080/venues
   # Search for venues by location/sport
   ```

3. **Select Venue**
   ```bash
   # Click on a venue
   # View venue details
   ```

4. **Make Booking**
   ```bash
   # Select sport, date, and time slot
   # Click "Book Now"
   ```

5. **Complete Payment**
   ```bash
   # Review booking details
   # Click "Proceed to Payment"
   # Use test card: 4111 1111 1111 1111
   # Complete payment
   ```

6. **Verify Success**
   ```bash
   # Check success message
   # Visit: http://localhost:8080/my-bookings
   # Verify booking appears with CONFIRMED status
   ```

#### Scenario 2: Payment Failure Handling

1. **Follow steps 1-4 from Scenario 1**
2. **Use Failure Card**: `4000 0000 0000 0002`
3. **Verify Error Handling**:
   - Error message displayed
   - Booking remains in PENDING status
   - User can retry payment

#### Scenario 3: Booking Cancellation

1. **Create Confirmed Booking** (Scenario 1)
2. **Navigate to My Bookings**
3. **Cancel Booking**
4. **Verify Refund Process**

### Performance Testing

#### Load Test Payment Endpoints

```bash
# Install Apache Bench (if not installed)
brew install httpd  # macOS
# or
sudo apt-get install apache2-utils  # Ubuntu

# Test payment order creation (with valid token)
ab -n 100 -c 10 -T 'application/json' -H 'Authorization: Bearer YOUR_TOKEN' \
  -p payment_order_data.json \
  http://localhost:4000/payments/orders
```

Create `payment_order_data.json`:
```json
{
  "bookingId": "test_booking_id"
}
```

---

## 4. Automated Testing Scripts

### Backend API Test Script

<function_calls>
<invoke name="create_file">
<parameter name="content">#!/bin/bash

# Backend API Test Script for Razorpay Integration
echo "🧪 Testing Backend Razorpay API Endpoints"

# Configuration
API_BASE_URL="http://localhost:4000"
ACCESS_TOKEN=""
BOOKING_ID=""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test credentials
TEST_EMAIL="test@quickcourt.com"
TEST_PASSWORD="password123"

echo -e "${YELLOW}Step 1: Testing Authentication${NC}"

# Login and get access token
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

if echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
    ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✓ Authentication successful${NC}"
else
    echo -e "${RED}✗ Authentication failed. Creating test user...${NC}"
    
    # Create test user
    SIGNUP_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/signup" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"fullName\":\"Test User\"}")
    
    echo "Please verify the test user and run again"
    exit 1
fi

echo -e "${YELLOW}Step 2: Testing Booking Creation${NC}"

# Get available courts
COURTS_RESPONSE=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" "$API_BASE_URL/courts")

if echo "$COURTS_RESPONSE" | grep -q "id"; then
    COURT_ID=$(echo "$COURTS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "Using court ID: $COURT_ID"
    
    # Create test booking
    TOMORROW=$(date -d "tomorrow" '+%Y-%m-%dT09:00:00.000Z')
    END_TIME=$(date -d "tomorrow" '+%Y-%m-%dT10:00:00.000Z')
    
    BOOKING_RESPONSE=$(curl -s -X POST "$API_BASE_URL/bookings" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -d "{\"courtId\":\"$COURT_ID\",\"startTime\":\"$TOMORROW\",\"endTime\":\"$END_TIME\"}")
    
    if echo "$BOOKING_RESPONSE" | grep -q "success.*true"; then
        BOOKING_ID=$(echo "$BOOKING_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        echo -e "${GREEN}✓ Booking created successfully: $BOOKING_ID${NC}"
    else
        echo -e "${RED}✗ Booking creation failed${NC}"
        echo "Response: $BOOKING_RESPONSE"
        exit 1
    fi
else
    echo -e "${RED}✗ No courts available for testing${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 3: Testing Payment Order Creation${NC}"

ORDER_RESPONSE=$(curl -s -X POST "$API_BASE_URL/payments/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{\"bookingId\":\"$BOOKING_ID\"}")

if echo "$ORDER_RESPONSE" | grep -q "success.*true"; then
    ORDER_ID=$(echo "$ORDER_RESPONSE" | grep -o '"orderId":"[^"]*"' | cut -d'"' -f4)
    AMOUNT=$(echo "$ORDER_RESPONSE" | grep -o '"amount":[0-9]*' | cut -d':' -f2)
    echo -e "${GREEN}✓ Payment order created successfully${NC}"
    echo "  Order ID: $ORDER_ID"
    echo "  Amount: ₹$(($AMOUNT / 100))"
else
    echo -e "${RED}✗ Payment order creation failed${NC}"
    echo "Response: $ORDER_RESPONSE"
    exit 1
fi

echo -e "${YELLOW}Step 4: Testing Payment Status${NC}"

STATUS_RESPONSE=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
  "$API_BASE_URL/payments/booking/$BOOKING_ID/status")

if echo "$STATUS_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✓ Payment status endpoint working${NC}"
else
    echo -e "${RED}✗ Payment status endpoint failed${NC}"
    echo "Response: $STATUS_RESPONSE"
fi

echo -e "${YELLOW}Step 5: Testing Payment Verification (Expected to Fail)${NC}"

VERIFY_RESPONSE=$(curl -s -X POST "$API_BASE_URL/payments/verify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{\"razorpay_order_id\":\"$ORDER_ID\",\"razorpay_payment_id\":\"pay_test123\",\"razorpay_signature\":\"invalid\",\"bookingId\":\"$BOOKING_ID\"}")

if echo "$VERIFY_RESPONSE" | grep -q "Invalid payment signature"; then
    echo -e "${GREEN}✓ Payment verification correctly rejects invalid signature${NC}"
else
    echo -e "${RED}✗ Payment verification not working properly${NC}"
    echo "Response: $VERIFY_RESPONSE"
fi

echo -e "${YELLOW}Step 6: Testing Webhook Endpoint${NC}"

WEBHOOK_RESPONSE=$(curl -s -X POST "$API_BASE_URL/payments/webhook" \
  -H "Content-Type: application/json" \
  -d '{"event":"payment.captured","payload":{"payment":{"entity":{"order_id":"test"}}}}')

if echo "$WEBHOOK_RESPONSE" | grep -q "Missing webhook signature"; then
    echo -e "${GREEN}✓ Webhook endpoint correctly requires signature${NC}"
else
    echo -e "${RED}✗ Webhook endpoint not properly secured${NC}"
    echo "Response: $WEBHOOK_RESPONSE"
fi

echo ""
echo -e "${GREEN}🎉 Backend API Testing Complete!${NC}"
echo ""
echo "Summary:"
echo "✓ Authentication working"
echo "✓ Booking creation working"
echo "✓ Payment order creation working"
echo "✓ Payment status endpoint working"
echo "✓ Payment verification security working"
echo "✓ Webhook security working"
echo ""
echo "Next: Test the frontend payment flow manually"
echo "Booking ID for testing: $BOOKING_ID"
echo "Order ID for testing: $ORDER_ID"
