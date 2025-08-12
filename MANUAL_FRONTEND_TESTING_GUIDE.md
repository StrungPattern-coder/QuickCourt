# 🖱️ Manual Frontend Testing Guide - QuickCourt Razorpay Integration

## 🎯 Complete Manual Testing by Clicking Through Everything

This guide will walk you through testing every button, form, and interaction in your QuickCourt app to ensure the Razorpay integration works perfectly.

---

## 🚀 Setup - Get Your App Running

### Step 1: Start Backend
```bash
cd server
npm run dev
```
**✅ Check:** Should see "Server running on port 4000" or similar

### Step 2: Start Frontend  
```bash
# In new terminal
cd /Users/sriram_kommalapudi/Projects/QuickCourt
npm run dev
```
**✅ Check:** Should see "Local: http://localhost:5173" or similar port

### Step 3: Open Your Browser
Navigate to: `http://localhost:5173` (or whatever port shows in terminal)

---

## 🧪 Manual Testing Scenarios

### 🔐 **TEST 1: Authentication Flow**

#### Login/Signup Testing
1. **Click "Login" button**
   - ✅ Login modal/page opens
   - ✅ Form fields visible (email, password)
   - ✅ "Sign up" link works

2. **Create Test Account**
   - Click "Sign Up" 
   - Fill form with test data:
     - Email: `test@quickcourt.com`
     - Password: `TestPass123!`
     - Name: `Test User`
   - ✅ Click "Create Account"
   - ✅ Success message appears
   - ✅ Redirected to dashboard/home

3. **Test Login**
   - Logout if logged in
   - Click "Login"
   - Enter test credentials
   - ✅ Click "Login"
   - ✅ Successfully logged in

---

### 🏟️ **TEST 2: Venue Browsing & Selection**

#### Browse Venues
1. **Homepage Navigation**
   - ✅ Click "Browse Venues" or similar
   - ✅ Venue listing page loads
   - ✅ Venues display with images, names, prices

2. **Venue Filtering** (if available)
   - ✅ Try filter by sport type
   - ✅ Try filter by location  
   - ✅ Try filter by price range
   - ✅ Results update correctly

3. **Venue Details**
   - ✅ Click on any venue card
   - ✅ Venue detail page opens
   - ✅ All venue info displays (images, description, amenities)
   - ✅ Court information visible

---

### 🎾 **TEST 3: Court Selection & Booking Flow**

#### Select Court and Time
1. **Court Selection**
   - On venue detail page
   - ✅ Click on different courts
   - ✅ Court details/pricing updates
   - ✅ "Book Now" button visible

2. **Date Selection**
   - ✅ Click on date picker
   - ✅ Select tomorrow's date
   - ✅ Available time slots appear
   - ✅ Past dates disabled

3. **Time Slot Selection**
   - ✅ Click on available time slots
   - ✅ Selected slot highlights
   - ✅ Pricing updates correctly
   - ✅ "Book Now" button active

#### Start Booking Process
4. **Initiate Booking**
   - ✅ Click "Book Now" 
   - ✅ Booking summary appears
   - ✅ All details correct (venue, court, date, time, price)
   - ✅ "Proceed to Payment" button visible

---

### 💳 **TEST 4: Payment Flow - The Main Event!**

#### Razorpay Payment Testing

5. **Open Payment Modal**
   - ✅ Click "Proceed to Payment"
   - ✅ Payment modal opens
   - ✅ Booking details displayed correctly
   - ✅ Total amount matches
   - ✅ "Pay Now" button visible

6. **Test Successful Payment**
   - ✅ Click "Pay Now"
   - ✅ Razorpay checkout modal opens
   - **Use Test Card:** `4111 1111 1111 1111`
   - **Expiry:** Any future date (e.g., 12/25)
   - **CVV:** Any 3 digits (e.g., 123)
   - **Name:** Any name
   - ✅ Click "Pay" in Razorpay modal
   - ✅ Payment processes successfully
   - ✅ Success screen appears
   - ✅ Booking confirmation details shown
   - ✅ "Go to My Bookings" button works

7. **Test Payment Failure**
   - Start new booking (repeat steps 1-5)
   - ✅ Click "Pay Now"
   - **Use Failure Card:** `4000 0000 0000 0002`
   - ✅ Payment fails gracefully
   - ✅ Error message displayed
   - ✅ "Try Again" option available
   - ✅ User can retry with different card

8. **Test Payment Cancellation**
   - Start another booking
   - ✅ Click "Pay Now"
   - ✅ Close/cancel Razorpay modal
   - ✅ Returns to booking page
   - ✅ No booking created
   - ✅ User can try again

---

### 📱 **TEST 5: Mobile Responsive Testing**

#### Test on Mobile Device or Browser DevTools
1. **Open Browser DevTools**
   - Press F12
   - Click "Toggle Device Toolbar" (mobile icon)
   - Select iPhone or Android device

2. **Mobile Navigation Testing**
   - ✅ Menu button works
   - ✅ Navigation drawer opens/closes
   - ✅ All links clickable with finger/touch

3. **Mobile Booking Flow**
   - ✅ Venue cards properly sized
   - ✅ Venue details readable
   - ✅ Date picker works on mobile
   - ✅ Time slots easily selectable
   - ✅ Payment modal fits screen
   - ✅ Razorpay checkout mobile-friendly

---

### 📋 **TEST 6: My Bookings Management**

#### Booking History & Management
1. **Access My Bookings**
   - ✅ Click "My Bookings" in navigation
   - ✅ Booking history page loads
   - ✅ Recent booking appears in list

2. **Booking Details**
   - ✅ Click on booking to view details
   - ✅ All information correct
   - ✅ Payment status shown
   - ✅ Booking status displayed

3. **Booking Actions**
   - ✅ Cancel booking (if feature available)
   - ✅ Download receipt/invoice (if available)
   - ✅ Contact support (if available)

---

### 🔄 **TEST 7: Different Payment Methods**

#### Test Various Payment Options
1. **Card Payment Variations**
   - **Visa:** `4111 1111 1111 1111` ✅
   - **Mastercard:** `5555 5555 5555 4444` ✅
   - **Insufficient Funds:** `4000 0000 0000 9995` ✅
   - **Declined Card:** `4000 0000 0000 0002` ✅

2. **UPI Testing** (if enabled)
   - ✅ Select UPI option in Razorpay
   - ✅ Use test UPI: `success@razorpay`
   - ✅ Test failure UPI: `failure@razorpay`

3. **Wallet Testing** (if available)
   - ✅ Try wallet payment options
   - ✅ Test success and failure scenarios

---

### 🌐 **TEST 8: Browser Compatibility**

#### Test in Different Browsers
1. **Chrome Testing**
   - ✅ Complete full booking flow
   - ✅ Payment modal works
   - ✅ All animations smooth

2. **Firefox Testing**
   - ✅ Repeat full booking flow
   - ✅ Check for any UI differences
   - ✅ Ensure payment works

3. **Safari Testing** (if on Mac)
   - ✅ Test complete flow
   - ✅ Check mobile Safari too

---

### ⚠️ **TEST 9: Edge Cases & Error Handling**

#### Test Unusual Scenarios
1. **Network Issues Simulation**
   - Turn off internet during payment
   - ✅ Proper error message shown
   - ✅ User can retry when online

2. **Form Validation**
   - ✅ Try booking without selecting date
   - ✅ Try invalid email in signup
   - ✅ Try weak passwords
   - ✅ All validations working

3. **Multiple Rapid Clicks**
   - ✅ Click "Pay Now" multiple times quickly
   - ✅ Only one payment processed
   - ✅ No duplicate bookings

---

## 🎯 **Test Scenarios with Expected Results**

### 💚 **SUCCESS SCENARIOS**

**Scenario 1: Happy Path Booking**
```
1. Login → 2. Browse Venues → 3. Select Venue → 
4. Choose Court → 5. Pick Date/Time → 6. Click Book Now → 
7. Pay with 4111111111111111 → 8. See Success Page
```
**✅ Expected:** Booking confirmed, payment successful, user redirected

**Scenario 2: Mobile Booking**
```
Same as above but on mobile device
```
**✅ Expected:** Smooth mobile experience, touch-friendly UI

### 🔴 **FAILURE SCENARIOS**

**Scenario 3: Payment Failure**
```
1-6 same as above → 7. Pay with 4000000000000002 → 8. See Error
```
**✅ Expected:** Clear error message, option to retry

**Scenario 4: Session Timeout**
```
1. Start booking → 2. Wait 30 minutes → 3. Try to pay
```
**✅ Expected:** Login prompt or session refresh

---

## 🐛 **What to Look For (Common Issues)**

### UI/UX Issues
- ❌ Buttons not clickable
- ❌ Loading states missing  
- ❌ Forms not validating
- ❌ Mobile layout broken
- ❌ Images not loading

### Payment Issues  
- ❌ Razorpay modal not opening
- ❌ Payment success not detected
- ❌ Wrong amounts charged
- ❌ Booking not created after payment
- ❌ Error messages not clear

### Navigation Issues
- ❌ Links not working
- ❌ Back button issues
- ❌ Page refreshes losing data
- ❌ Routes not loading

---

## 📝 **Testing Checklist**

### Before You Start
- [ ] Backend running on port 4000
- [ ] Frontend running (usually port 5173)
- [ ] Test account created
- [ ] Browser DevTools open (F12)

### Authentication
- [ ] Sign up works
- [ ] Login works  
- [ ] Logout works
- [ ] Form validations work

### Venue Browsing
- [ ] Venues load and display
- [ ] Filters work (if available)
- [ ] Venue details open
- [ ] Images load properly

### Booking Flow
- [ ] Court selection works
- [ ] Date picker functional
- [ ] Time slots selectable
- [ ] Pricing updates correctly
- [ ] Booking summary accurate

### Payment Integration
- [ ] Payment modal opens
- [ ] Razorpay loads correctly
- [ ] Test card payments work
- [ ] Success screen appears
- [ ] Failure handling works
- [ ] Payment cancellation works

### Mobile Experience
- [ ] Responsive design works
- [ ] Touch interactions smooth
- [ ] Mobile payment flows work
- [ ] Text readable on mobile

### Browser Testing
- [ ] Chrome works completely
- [ ] Firefox works completely  
- [ ] Safari works (if available)
- [ ] Mobile browsers work

---

## 🎉 **When Everything Works**

You should be able to:
1. **Register/Login** smoothly
2. **Browse venues** without issues
3. **Select courts and times** easily
4. **Complete payments** successfully with test cards
5. **See confirmation** screens with correct details
6. **View bookings** in your booking history
7. **Handle errors** gracefully when payments fail

---

## 🆘 **Troubleshooting Common Issues**

### Payment Modal Won't Open
```bash
# Check browser console (F12 → Console)
# Look for JavaScript errors
# Verify Razorpay script loaded
```

### Payments Not Processing
- Check network tab in DevTools
- Verify API calls are being made
- Check server logs for errors

### UI Looks Broken
- Hard refresh (Ctrl+F5 or Cmd+Shift+R)
- Clear browser cache
- Check for CSS/JS errors in console

---

**🎯 Happy Manual Testing!** 

Click through everything, try to break it, and make sure users will have a smooth experience! 

**Pro Tip:** Test like you're a real customer who just wants to book a court quickly! 🏆
