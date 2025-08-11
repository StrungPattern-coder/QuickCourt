// Script to verify admin OTP and then log in
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:4000';
const otpCode = process.argv[2];

if (!otpCode) {
  console.log('❌ Please provide OTP code: node verify-admin.js [OTP_CODE]');
  process.exit(1);
}

async function verifyAndLogin() {
  try {
    // Get userId from environment or you'll need to pass it
    // For now, we'll extract it from the signup response logs
    console.log('⚠️  You need to get the userId from the signup response.');
    console.log('   Look for the signup response in the server logs or previous output.');
    console.log('   Then run: node verify-admin.js [USER_ID] [OTP_CODE]');
    
    const userId = process.argv[2];
    const otp = process.argv[3];
    
    if (!userId || !otp) {
      console.log('Usage: node verify-admin.js [USER_ID] [OTP_CODE]');
      return;
    }
    
    // Step 1: Verify OTP
    console.log('Verifying OTP...');
    const verifyResponse = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, otp })
    });
    
    const verifyData = await verifyResponse.json();
    console.log('Verify response:', verifyData);
    
    if (verifyResponse.ok) {
      console.log('✅ Admin account verified!');
      
      // Step 2: Login
      console.log('Logging in...');
      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@quickcourt.com',
          password: 'admin123456'
        })
      });
      
      const loginData = await loginResponse.json();
      
      if (loginResponse.ok) {
        console.log('✅ Admin login successful!');
        console.log('🔑 Access Token:', loginData.accessToken);
        console.log('');
        console.log('🎯 Now you can:');
        console.log('1. Go to http://localhost:8083');
        console.log('2. Log in with admin@quickcourt.com / admin123456');
        console.log('3. Navigate to Admin Dashboard');
        console.log('4. Approve pending venues!');
      } else {
        console.log('❌ Login failed:', loginData);
      }
    } else {
      console.log('❌ OTP verification failed:', verifyData);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyAndLogin();
