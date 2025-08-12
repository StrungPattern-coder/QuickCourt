#!/bin/bash

# Frontend Test Script for Razorpay Integration
echo "🎭 Testing Frontend Razorpay Integration"

# Configuration
FRONTEND_URL="http://localhost:8080"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${YELLOW}Step 1: Checking Frontend Service${NC}"

if curl -s "$FRONTEND_URL" > /dev/null; then
    echo -e "${GREEN}✓ Frontend is running${NC}"
else
    echo -e "${RED}✗ Frontend is not running${NC}"
    echo "Please start frontend with: npm run dev"
    exit 1
fi

echo -e "${YELLOW}Step 2: Checking Environment Configuration${NC}"

if [ -f ".env" ]; then
    if grep -q "VITE_RAZORPAY_KEY_ID" ".env"; then
        echo -e "${GREEN}✓ VITE_RAZORPAY_KEY_ID configured${NC}"
    else
        echo -e "${RED}✗ VITE_RAZORPAY_KEY_ID not configured${NC}"
        echo "Add VITE_RAZORPAY_KEY_ID to .env file"
    fi
else
    echo -e "${YELLOW}⚠ .env file not found, checking .env.example${NC}"
    if [ -f ".env.example" ]; then
        echo "Please copy .env.example to .env and configure your Razorpay keys"
    fi
fi

echo -e "${YELLOW}Step 3: Checking Build Assets${NC}"

# Check if Razorpay script would load
echo "Testing Razorpay CDN accessibility..."
if curl -s "https://checkout.razorpay.com/v1/checkout.js" > /dev/null; then
    echo -e "${GREEN}✓ Razorpay CDN accessible${NC}"
else
    echo -e "${RED}✗ Razorpay CDN not accessible${NC}"
    echo "Check internet connection"
fi

echo -e "${YELLOW}Step 4: Manual Testing Instructions${NC}"

echo ""
echo -e "${BLUE}🧑‍💻 MANUAL TESTING REQUIRED${NC}"
echo "=================================="
echo ""
echo "Please follow these steps in your browser:"
echo ""
echo "1. 📱 Open: $FRONTEND_URL"
echo ""
echo "2. 🔐 Login/Register:"
echo "   - Click Login/Signup"
echo "   - Use test credentials or create new account"
echo ""
echo "3. 🏟️  Browse Venues:"
echo "   - Go to Venues page"
echo "   - Select any venue"
echo ""
echo "4. 📅 Make Booking:"
echo "   - Select sport, date, and time slot"
echo "   - Click 'Book Now'"
echo ""
echo "5. 💳 Test Payment:"
echo "   - Review booking details"
echo "   - Click 'Proceed to Payment'"
echo "   - Payment modal should open"
echo ""
echo "6. 🧪 Use Test Cards:"
echo "   - Success: 4111 1111 1111 1111"
echo "   - Failure: 4000 0000 0000 0002"
echo "   - CVV: 123"
echo "   - Expiry: 12/25"
echo ""
echo "7. ✅ Verify Results:"
echo "   - Success case: Should show confirmation"
echo "   - Failure case: Should show error message"
echo ""
echo "8. 📋 Check Bookings:"
echo "   - Go to 'My Bookings'"
echo "   - Verify booking status"

echo ""
echo -e "${YELLOW}Step 5: Browser Console Testing${NC}"

echo ""
echo "Open Browser Developer Tools and run these tests:"
echo ""
echo -e "${BLUE}// Test 1: Check Razorpay loading${NC}"
echo "console.log(window.Razorpay ? '✓ Razorpay loaded' : '✗ Razorpay not loaded');"
echo ""
echo -e "${BLUE}// Test 2: Check environment variables${NC}"
echo "console.log('Razorpay Key:', import.meta.env.VITE_RAZORPAY_KEY_ID);"
echo ""
echo -e "${BLUE}// Test 3: Test API connectivity${NC}"
echo "fetch('http://localhost:4000/health')"
echo "  .then(r => r.json())"
echo "  .then(d => console.log('✓ API connected:', d))"
echo "  .catch(e => console.log('✗ API connection failed:', e));"
echo ""
echo -e "${BLUE}// Test 4: Test payment hook loading${NC}"
echo "// Navigate to booking page and check for payment hook initialization"

echo ""
echo -e "${YELLOW}Step 6: Network Monitoring${NC}"

echo ""
echo "In Browser Developer Tools > Network tab, monitor for:"
echo "✓ Razorpay script loading from CDN"
echo "✓ API calls to /payments/orders"
echo "✓ API calls to /payments/verify"
echo "✓ No CORS errors"
echo "✓ Proper status codes (200, 201, 400, etc.)"

echo ""
echo -e "${GREEN}🎉 Frontend Testing Setup Complete!${NC}"
echo ""
echo "Complete the manual testing steps above and report any issues."

# Create a simple HTML test page for isolated testing
cat > razorpay-test.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Razorpay Integration Test</title>
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</head>
<body>
    <h1>Razorpay Integration Test</h1>
    <button onclick="testRazorpay()">Test Razorpay Payment</button>
    
    <script>
        function testRazorpay() {
            // Replace with your test key
            const keyId = 'rzp_test_your_key_here';
            
            if (!window.Razorpay) {
                alert('Razorpay not loaded');
                return;
            }
            
            const options = {
                "key": keyId,
                "amount": "50000", // 500 INR in paise
                "currency": "INR",
                "name": "QuickCourt Test",
                "description": "Test Payment",
                "order_id": "order_test123",
                "handler": function (response){
                    console.log('Payment Success:', response);
                    alert('Payment successful!');
                },
                "prefill": {
                    "name": "Test User",
                    "email": "test@example.com",
                    "contact": "9999999999"
                },
                "theme": {
                    "color": "#16a34a"
                }
            };
            
            const rzp = new Razorpay(options);
            rzp.open();
        }
        
        // Test script loading
        window.addEventListener('load', function() {
            console.log('Razorpay loaded:', !!window.Razorpay);
        });
    </script>
</body>
</html>
EOF

echo ""
echo -e "${BLUE}📄 Created isolated test file: razorpay-test.html${NC}"
echo "Open this file in browser for isolated Razorpay testing"
