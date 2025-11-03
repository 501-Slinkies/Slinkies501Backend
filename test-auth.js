#!/usr/bin/env node
/**
 * Simple authentication flow test script
 * Run with: node test-auth.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAuthenticationFlow() {
  console.log('🧪 Testing Authentication Flow...\n');

  try {
    // Test 1: Login with valid credentials
    console.log('1️⃣ Testing login...');
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      email: 'test@example.com',
      password: 'password123',
      role: 'admin'
    });

    if (loginResponse.data.success) {
      console.log('✅ Login successful');
      console.log('   User:', loginResponse.data.user);
      console.log('   Access Token:', loginResponse.data.accessToken ? 'Generated' : 'Missing');
      console.log('   Refresh Token:', loginResponse.data.refreshToken ? 'Generated' : 'Missing');
      console.log('   Expires In:', loginResponse.data.expiresIn);

      const { accessToken, refreshToken } = loginResponse.data;

      // Test 2: Use access token for authenticated request
      console.log('\n2️⃣ Testing authenticated request...');
      try {
        const protectedResponse = await axios.get(`${BASE_URL}/api/rides`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        console.log('✅ Authenticated request successful');
      } catch (error) {
        console.log('⚠️  Authenticated request failed (expected if no rides endpoint)');
      }

      // Test 3: Refresh token
      console.log('\n3️⃣ Testing token refresh...');
      const refreshResponse = await axios.post(`${BASE_URL}/refresh`, {
        refreshToken: refreshToken
      });

      if (refreshResponse.data.success) {
        console.log('✅ Token refresh successful');
        console.log('   New Access Token:', refreshResponse.data.accessToken ? 'Generated' : 'Missing');
      } else {
        console.log('❌ Token refresh failed');
      }

      // Test 4: Logout
      console.log('\n4️⃣ Testing logout...');
      const logoutResponse = await axios.post(`${BASE_URL}/logout`);
      if (logoutResponse.data.success) {
        console.log('✅ Logout successful');
      } else {
        console.log('❌ Logout failed');
      }

    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
    }

  } catch (error) {
    if (error.response) {
      console.log('❌ HTTP Error:', error.response.status, error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ Connection refused. Make sure the server is running on port 3000');
    } else {
      console.log('❌ Error:', error.message);
    }
  }

  console.log('\n🏁 Authentication flow test completed');
}

// Run the test
testAuthenticationFlow();

