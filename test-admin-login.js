// Test Admin Login and Access
// Run this with: node test-admin-login.js

import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api';

async function testAdminLogin() {
  console.log('🔍 Testing Admin Login and Access...\n');

  try {
    // 1. Test login with admin credentials
    console.log('1. Testing admin login...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed:', loginResponse.status, loginResponse.statusText);
      const errorText = await loginResponse.text();
      console.log('Error details:', errorText);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful!');
    console.log('User data:', loginData.user);
    console.log('Token received:', loginData.token ? 'Yes' : 'No');

    // 2. Test admin routes access
    console.log('\n2. Testing admin routes access...');
    const token = loginData.token;

    // Test system stats endpoint
    const statsResponse = await fetch(`${API_URL}/admin/system-stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log('✅ Admin system stats accessible');
      console.log('Stats:', statsData.overview);
    } else {
      console.log('❌ Admin system stats failed:', statsResponse.status);
      const errorText = await statsResponse.text();
      console.log('Error:', errorText);
    }

    // Test users endpoint
    const usersResponse = await fetch(`${API_URL}/admin/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log('✅ Admin users endpoint accessible');
      console.log(`Found ${usersData.length} users`);
    } else {
      console.log('❌ Admin users endpoint failed:', usersResponse.status);
      const errorText = await usersResponse.text();
      console.log('Error:', errorText);
    }

  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    console.log('Make sure the backend server is running on http://localhost:5000');
  }
}

// Run the test
testAdminLogin();