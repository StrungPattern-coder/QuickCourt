# 🚀 Quick Start: Manual Razorpay Testing

## Step 1: Start Your Services

### Terminal 1 - Backend Server
```bash
cd /Users/sriram_kommalapudi/Projects/QuickCourt/server
npm run dev
```
**✅ Wait for:** "Server running on port 4000" or similar message

### Terminal 2 - Frontend App  
```bash
cd /Users/sriram_kommalapudi/Projects/QuickCourt
npm run dev
```
**✅ Wait for:** "Local: http://localhost:5173" (or similar port)

---

## Step 2: Open Your App

**🌐 Open in Browser:** `http://localhost:5173`

---

## Step 3: Start Manual Testing!

### 🎯 **CRITICAL TEST PATH - Do This First:**

1. **Homepage Test**
   - ✅ Click around the homepage
   - ✅ Check all navigation links work
   - ✅ Look for any broken images/styling

2. **Login/Register**
   - ✅ Click "Sign Up" 
   - ✅ Create account: `test@quickcourt.com` / `TestPass123!`
   - ✅ Login with your new account

3. **Browse Venues**
   - ✅ Click "Play" or "Book" or "Venues" in navigation
   - ✅ Browse available venues
   - ✅ Click on a venue to see details

4. **Make a Booking** 
   - ✅ Select a court
   - ✅ Pick tomorrow's date
   - ✅ Choose an available time slot
   - ✅ Click "Book Now"

5. **💳 PAY WITH RAZORPAY (THE BIG TEST!)**
   - ✅ Review booking details
   - ✅ Click "Proceed to Payment"
   - ✅ Razorpay modal opens
   - **Use Test Card:** `4111 1111 1111 1111`
   - **Expiry:** `12/25` 
   - **CVV:** `123`
   - ✅ Complete payment
   - ✅ See success confirmation!

6. **Check Your Booking**
   - ✅ Navigate to "My Bookings"
   - ✅ Your booking should appear there!

---

## 🧪 Test Different Scenarios

### ✅ **SUCCESS CASES**
- Card: `4111 1111 1111 1111` → Should work perfectly
- UPI: `success@razorpay` → Should succeed  

### ❌ **FAILURE CASES**  
- Card: `4000 0000 0000 0002` → Should show error gracefully
- UPI: `failure@razorpay` → Should fail with proper message

---

## 📱 Mobile Testing

1. **Open Browser DevTools** (F12)
2. **Click mobile icon** (toggle device toolbar)  
3. **Select iPhone or Android** from dropdown
4. **Repeat the booking flow** on mobile view
5. **Check:** Everything works with touch/tap

---

## 🚨 What to Watch For

### ✅ **Good Signs:**
- Smooth navigation between pages
- Payment modal opens properly
- Razorpay checkout loads
- Success/error messages clear
- Mobile version looks good
- No console errors (press F12 → Console)

### ❌ **Red Flags:**
- Buttons don't click
- Payment modal won't open  
- Razorpay doesn't load
- Pages crash or show errors
- Mobile layout broken
- Console full of errors

---

## 🆘 **If Something's Wrong**

### Quick Fixes:
```bash
# Hard refresh browser
Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)

# Check both terminals are running
# Backend should show "Server running"
# Frontend should show "Local: http://localhost:5173"

# Check browser console for errors
F12 → Console tab
```

### Common Issues:
- **Payment modal won't open:** Check browser console for errors
- **Razorpay won't load:** Check internet connection & firewall
- **Login doesn't work:** Check backend server is running
- **Pages look broken:** Hard refresh browser

---

## 📞 **Need Help?**

Check the detailed guide: `MANUAL_FRONTEND_TESTING_GUIDE.md`

**Happy Manual Testing! 🎉**

*Click everything, try to break it, and make sure your customers will love it!* 🏆
