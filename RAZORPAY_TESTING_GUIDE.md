# QuickCourt Razorpay Testing Guide

## Complete Testing Strategy for Frontend, Backend & Full Website

### 🎯 Testing Overview

This guide covers comprehensive testing of the Razorpay integration across:
- **Backend API** - Payment services, webhooks, database
- **Frontend** - UI components, payment flows, user experience  
- **Full Website** - End-to-end user journeys

---

## 🚀 Quick Start Testing

### 1. Start Services
```bash
# Terminal 1: Start Backend
cd server
npm run dev

# Terminal 2: Start Frontend  
cd ..
npm run dev
```

### 2. Run Test Scripts
```bash
# Backend API tests
./test-backend-api.sh

# Frontend tests
./test-frontend.sh

# Complete website tests
./test-complete-website.sh
```

---

## 🔧 Backend Testing

### Automated Backend Tests
```bash
./test-backend-api.sh
```

**What it tests:**
- API health endpoints
- Payment order creation
- Payment verification
- Webhook handling
- Refund processing
- Authentication & authorization
- Error handling

### Manual Backend Tests

#### 1. Direct API Testing with curl

**Create Payment Order:**
```bash
# First get auth token by logging in
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'

# Use token to create payment order
curl -X POST http://localhost:4000/payments/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 1000,
    "currency": "INR",
    "booking_details": {
      "venue_id": "venue_123",
      "court_id": "court_456", 
      "date": "2024-01-20",
      "time_slot": "10:00-11:00"
    }
  }'
```

**Verify Payment:**
```bash
curl -X POST http://localhost:4000/payments/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "razorpay_payment_id": "pay_test_123",
    "razorpay_order_id": "order_test_123", 
    "razorpay_signature": "test_signature"
  }'
```

#### 2. Database Testing

**Check Payment Records:**
```bash
# Connect to your database and verify
# Payment records are created correctly
# Booking statuses are updated properly
```

---

## 🎨 Frontend Testing

### Automated Frontend Tests
```bash
./test-frontend.sh
```

**What it tests:**
- Component rendering
- Payment modal functionality
- Hook behavior
- API integration
- Error handling

### Manual Frontend Tests

#### 1. Isolated Frontend Testing
```bash
# Open standalone test page
open razorpay-test.html
```

#### 2. UI Component Tests

**Payment Modal:**
- ✅ Opens correctly when triggered
- ✅ Shows proper venue/booking details
- ✅ Integrates with Razorpay checkout
- ✅ Handles success/failure states
- ✅ Displays loading states

**Booking Flow:**
- ✅ Venue selection works
- ✅ Court selection works  
- ✅ Time slot picker works
- ✅ Booking summary accurate
- ✅ Payment integration smooth

**Success/Error Screens:**
- ✅ Success page shows booking details
- ✅ Error handling graceful
- ✅ Retry mechanisms work
- ✅ Navigation flows correct

#### 3. Browser Testing

Test in multiple browsers:
- Chrome (latest)
- Firefox (latest)  
- Safari (latest)
- Mobile browsers

#### 4. Responsive Testing

Test on different screen sizes:
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)

---

## 🌐 Complete Website Testing

### Automated Complete Tests
```bash
./test-complete-website.sh
```

**What it tests:**
- Service health checks
- End-to-end API flows
- Security validations
- Performance metrics
- Integration points

### Manual Website Testing

#### Critical User Journeys

**🎯 Journey 1: Successful Booking**
1. Visit http://localhost:8080
2. Register/Login with test account
3. Browse available venues
4. Select venue → court → time slot
5. Click "Book Now"
6. Complete payment with test card: `4111 1111 1111 1111`
7. **Verify:** Success message + booking confirmed + email sent

**🎯 Journey 2: Payment Failure Recovery**
1. Follow steps 1-5 from Journey 1
2. Use failure test card: `4000 0000 0000 0002`
3. **Verify:** Clear error message displayed
4. **Verify:** User can retry payment
5. **Verify:** Booking not created in database

**🎯 Journey 3: Booking Management**
1. Create successful booking (Journey 1)
2. Navigate to "My Bookings"
3. View booking details
4. Cancel booking (if cancellation enabled)
5. **Verify:** Refund initiated properly

**🎯 Journey 4: Multiple Payment Methods**

Test different payment options:
- **Card Payments:**
  - Success: `4111 1111 1111 1111`
  - Failure: `4000 0000 0000 0002`
  - Insufficient funds: `4000 0000 0000 9995`
- **UPI Testing:**
  - Success: `success@razorpay`
  - Failure: `failure@razorpay`
- **Wallet Testing** (in test mode)

#### Cross-Browser Testing

**Desktop Testing:**
- Chrome: Payment flows + UI responsiveness
- Firefox: Payment modals + form validation
- Safari: Razorpay checkout + success screens
- Edge: Complete booking journey

**Mobile Testing:**
- iOS Safari: Touch interactions + payment
- Android Chrome: Responsive design + UX
- Mobile Firefox: Form handling

---

## 📊 Performance Testing

### Load Testing
```bash
# Install apache bench if not available
brew install httpd

# Test API performance
ab -n 100 -c 10 http://localhost:4000/health

# Test payment endpoint (with auth token)
ab -n 50 -c 5 -H "Authorization: Bearer YOUR_TOKEN" \
   -H "Content-Type: application/json" \
   -p payment-data.json \
   http://localhost:4000/payments/orders
```

### Frontend Performance
- Lighthouse audit on booking pages
- Bundle size analysis
- Network request optimization
- Image loading performance

---

## 🔒 Security Testing

### Backend Security
- ✅ Authentication required for payment endpoints
- ✅ Webhook signature verification
- ✅ Input validation and sanitization
- ✅ Rate limiting enabled
- ✅ CORS properly configured
- ✅ Environment variables secure

### Frontend Security
- ✅ API keys not exposed in browser
- ✅ Payment data handled securely
- ✅ XSS protection in place
- ✅ Form validation client/server side

---

## 🐛 Testing Edge Cases

### Network Issues
- Test with slow network connections
- Test with intermittent connectivity
- Verify retry mechanisms work

### Payment Edge Cases
- Very small amounts (₹1)
- Large amounts (₹50,000+)  
- International cards
- Expired cards
- Insufficient balance scenarios

### UI Edge Cases
- Long venue/court names
- Special characters in form fields
- Multiple rapid clicking
- Back button behavior during payment

---

## 📋 Testing Checklist

### Pre-Production Testing
- [ ] All automated tests passing
- [ ] Manual user journeys completed
- [ ] Cross-browser testing done
- [ ] Mobile responsiveness verified
- [ ] Performance benchmarks met
- [ ] Security validation completed
- [ ] Error scenarios tested
- [ ] Webhook endpoints configured
- [ ] Production keys ready
- [ ] Monitoring setup complete

### Production Testing
- [ ] Test with live Razorpay keys
- [ ] Configure production webhooks  
- [ ] Monitor real transactions
- [ ] Verify email notifications
- [ ] Test refund processing
- [ ] Check analytics tracking

---

## 🔧 Troubleshooting

### Common Issues

**Backend Issues:**
```bash
# Database connection issues
# Check Prisma connection
npx prisma db push

# Razorpay API errors
# Verify keys in .env file
# Check API rate limits
```

**Frontend Issues:**
```bash
# Razorpay not loading
# Check CDN accessibility
# Verify VITE_RAZORPAY_KEY_ID

# Payment modal not opening
# Check browser console for errors
# Verify component integration
```

### Debug Commands
```bash
# Backend logs
cd server && npm run dev # Check console output

# Frontend logs  
# Open browser DevTools → Console

# Network debugging
# Check Network tab in DevTools
```

---

## 📞 Support

### Razorpay Testing Resources
- [Test Card Numbers](https://razorpay.com/docs/payments/payments/test-card-details/)
- [Webhook Testing](https://razorpay.com/docs/webhooks/testing/)
- [API Documentation](https://razorpay.com/docs/api/)

### QuickCourt Documentation
- `RAZORPAY_INTEGRATION.md` - Implementation details
- `STRIPE_REMOVAL_MIGRATION.md` - Migration notes
- Test scripts in project root

---

## ✅ Test Results Tracking

Create a test report for each testing session:

```markdown
# Test Session Report - [Date]

## Environment
- Backend: Running on port 4000
- Frontend: Running on port 8080  
- Database: Connected
- Razorpay: Test mode

## Test Results
- [ ] Backend API tests: PASS/FAIL
- [ ] Frontend component tests: PASS/FAIL
- [ ] Complete user journeys: PASS/FAIL  
- [ ] Cross-browser testing: PASS/FAIL
- [ ] Mobile testing: PASS/FAIL
- [ ] Performance testing: PASS/FAIL

## Issues Found
1. [Describe any issues and their resolution]

## Next Steps
1. [List items to address before production]
```

---

## 🎉 Ready for Production!

Once all tests pass:

1. **Update Environment:** Switch to live Razorpay keys
2. **Configure Webhooks:** Set up production webhook endpoints
3. **Enable Monitoring:** Set up logging and analytics  
4. **Deploy:** Push to production environment
5. **Verify:** Test with small real transaction

**Happy Testing! 🚀**
