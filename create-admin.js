// Quick script to create an admin account for testing venue approval
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:4000';

async function createAdminAccount() {
  try {
    console.log('Creating admin account...');
    
    // Step 1: Sign up as ADMIN
    const signupResponse = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@quickcourt.com',
        password: 'admin123456',
        fullName: 'QuickCourt Admin',
        role: 'ADMIN'
      })
    });
    
    const signupData = await signupResponse.json();
    console.log('Signup response:', signupData);
    
    if (signupResponse.ok && signupData.userId) {
      console.log('✅ Admin account created!');
      console.log('📧 Check the server logs for the OTP verification code');
      console.log('');
      console.log('📋 Admin Login Details:');
      console.log('   Email: admin@quickcourt.com');
      console.log('   Password: admin123456');
      console.log('   Role: ADMIN');
      console.log('');
      console.log('🔢 Next steps:');
      console.log('1. Check server logs for OTP: [OTP] for admin@quickcourt.com: XXXXXX');
      console.log('2. Verify with: node verify-admin.js [OTP_CODE]');
    } else {
      console.log('❌ Failed to create admin account:', signupData);
    }
  } catch (error) {
    console.error('❌ Error creating admin account:', error.message);
  }
}

createAdminAccount();
