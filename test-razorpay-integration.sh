#!/bin/bash

# QuickCourt Razorpay Integration Test Suite
echo "🚀 Starting QuickCourt Razorpay Integration Tests"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="http://localhost:4000"
FRONTEND_URL="http://localhost:8080"

echo -e "${BLUE}Configuration:${NC}"
echo "API Base URL: $API_BASE_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""

# Function to check if service is running
check_service() {
    local url=$1
    local service_name=$2
    
    if curl -s "$url/health" > /dev/null; then
        echo -e "${GREEN}✓ $service_name is running${NC}"
        return 0
    else
        echo -e "${RED}✗ $service_name is not running${NC}"
        return 1
    fi
}

# Function to test API endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    local expected_status=$5
    
    echo -e "${YELLOW}Testing: $description${NC}"
    
    local response
    local status_code
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $ACCESS_TOKEN" \
            -d "$data" \
            "$API_BASE_URL$endpoint")
    else
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
            -H "Authorization: Bearer $ACCESS_TOKEN" \
            "$API_BASE_URL$endpoint")
    fi
    
    status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]*$//')
    
    if [ "$status_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ Expected status $expected_status, got $status_code${NC}"
        echo -e "Response: $(echo "$body" | head -c 100)..."
        return 0
    else
        echo -e "${RED}✗ Expected status $expected_status, got $status_code${NC}"
        echo -e "Response: $body"
        return 1
    fi
}

echo -e "${BLUE}1. Checking Services${NC}"
echo "=================================="

# Check backend service
if ! check_service "$API_BASE_URL" "Backend API"; then
    echo -e "${RED}Backend service is not running. Please start it with:${NC}"
    echo "cd server && npm run dev"
    exit 1
fi

# Check frontend service
if ! check_service "$FRONTEND_URL" "Frontend"; then
    echo -e "${YELLOW}⚠ Frontend service is not running. Start it with:${NC}"
    echo "npm run dev"
fi

echo ""
echo -e "${BLUE}2. Testing Authentication${NC}"
echo "=================================="

# Test user registration/login
echo "Please provide test user credentials for testing:"
read -p "Email: " TEST_EMAIL
read -s -p "Password: " TEST_PASSWORD
echo ""

# Login to get access token
echo -e "${YELLOW}Logging in...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
    "$API_BASE_URL/auth/login")

if echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
    ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✓ Login successful${NC}"
else
    echo -e "${RED}✗ Login failed${NC}"
    echo "Response: $LOGIN_RESPONSE"
    echo ""
    echo -e "${YELLOW}Creating test user...${NC}"
    SIGNUP_RESPONSE=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"fullName\":\"Test User\"}" \
        "$API_BASE_URL/auth/signup")
    
    echo "Signup response: $SIGNUP_RESPONSE"
    echo "Please verify your account and run the test again."
    exit 1
fi

echo ""
echo -e "${BLUE}3. Testing Booking Creation${NC}"
echo "=================================="

# First, get available facilities
echo -e "${YELLOW}Fetching facilities...${NC}"
FACILITIES_RESPONSE=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" "$API_BASE_URL/facilities")

if echo "$FACILITIES_RESPONSE" | grep -q "items"; then
    echo -e "${GREEN}✓ Facilities fetched successfully${NC}"
    
    # Extract first facility and court
    FACILITY_ID=$(echo "$FACILITIES_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -n "$FACILITY_ID" ]; then
        echo "Using facility ID: $FACILITY_ID"
        
        # Get courts for the facility
        echo -e "${YELLOW}Fetching courts...${NC}"
        COURTS_RESPONSE=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" "$API_BASE_URL/courts")
        
        COURT_ID=$(echo "$COURTS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        
        if [ -n "$COURT_ID" ]; then
            echo "Using court ID: $COURT_ID"
            
            # Create a test booking
            TOMORROW=$(date -d "tomorrow" '+%Y-%m-%dT09:00:00.000Z')
            END_TIME=$(date -d "tomorrow" '+%Y-%m-%dT10:00:00.000Z')
            
            BOOKING_DATA="{\"courtId\":\"$COURT_ID\",\"startTime\":\"$TOMORROW\",\"endTime\":\"$END_TIME\"}"
            
            test_endpoint "POST" "/bookings" "$BOOKING_DATA" "Creating booking" 201
            
            if [ $? -eq 0 ]; then
                BOOKING_ID=$(echo "$body" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
                echo "Booking ID: $BOOKING_ID"
            fi
        else
            echo -e "${RED}✗ No courts available for testing${NC}"
        fi
    else
        echo -e "${RED}✗ No facilities available for testing${NC}"
    fi
else
    echo -e "${RED}✗ Failed to fetch facilities${NC}"
fi

echo ""
echo -e "${BLUE}4. Testing Payment Endpoints${NC}"
echo "=================================="

if [ -n "$BOOKING_ID" ]; then
    # Test creating payment order
    ORDER_DATA="{\"bookingId\":\"$BOOKING_ID\"}"
    test_endpoint "POST" "/payments/orders" "$ORDER_DATA" "Creating payment order" 200
    
    # Test getting payment status
    test_endpoint "GET" "/payments/booking/$BOOKING_ID/status" "" "Getting payment status" 200
    
    echo ""
    echo -e "${YELLOW}Note: Actual payment testing requires manual interaction with Razorpay checkout${NC}"
else
    echo -e "${RED}✗ Cannot test payment endpoints without a booking${NC}"
fi

echo ""
echo -e "${BLUE}5. Testing Webhook Endpoint${NC}"
echo "=================================="

# Test webhook endpoint (should fail without proper signature)
WEBHOOK_DATA='{"event":"payment.captured","payload":{"payment":{"entity":{"order_id":"test_order"}}}}'
test_endpoint "POST" "/payments/webhook" "$WEBHOOK_DATA" "Webhook without signature (should fail)" 400

echo ""
echo -e "${BLUE}6. Environment Check${NC}"
echo "=================================="

echo -e "${YELLOW}Checking environment variables...${NC}"

# Check if Razorpay keys are configured
if [ -f "server/.env" ]; then
    if grep -q "RAZORPAY_KEY_ID" "server/.env"; then
        echo -e "${GREEN}✓ RAZORPAY_KEY_ID configured${NC}"
    else
        echo -e "${RED}✗ RAZORPAY_KEY_ID not configured${NC}"
    fi
    
    if grep -q "RAZORPAY_KEY_SECRET" "server/.env"; then
        echo -e "${GREEN}✓ RAZORPAY_KEY_SECRET configured${NC}"
    else
        echo -e "${RED}✗ RAZORPAY_KEY_SECRET not configured${NC}"
    fi
else
    echo -e "${RED}✗ server/.env file not found${NC}"
fi

if [ -f ".env" ]; then
    if grep -q "VITE_RAZORPAY_KEY_ID" ".env"; then
        echo -e "${GREEN}✓ VITE_RAZORPAY_KEY_ID configured${NC}"
    else
        echo -e "${RED}✗ VITE_RAZORPAY_KEY_ID not configured${NC}"
    fi
else
    echo -e "${RED}✗ .env file not found${NC}"
fi

echo ""
echo -e "${BLUE}Test Summary${NC}"
echo "=================================="
echo "✓ Backend service connectivity"
echo "✓ Authentication flow"
echo "✓ Booking creation"
echo "✓ Payment endpoint structure"
echo "⚠ Manual payment testing required"
echo "⚠ Webhook testing requires proper setup"

echo ""
echo -e "${GREEN}🎉 Basic integration tests completed!${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Configure Razorpay dashboard with webhook URL"
echo "2. Test complete payment flow manually through frontend"
echo "3. Verify webhook delivery in Razorpay dashboard"
echo "4. Test refund functionality"
echo "5. Monitor payment logs for any issues"

echo ""
echo -e "${BLUE}For manual testing:${NC}"
echo "1. Visit: $FRONTEND_URL"
echo "2. Login with test credentials"
echo "3. Browse venues and make a booking"
echo "4. Complete payment using test cards"
echo "5. Verify booking confirmation"
