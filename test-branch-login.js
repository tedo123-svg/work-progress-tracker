#!/usr/bin/env node

/**
 * Test Branch User Login
 * Tests if branch users can login successfully
 */

const https = require('https');

const API_URL = 'http://localhost:5000/api';

function testLogin(username, password) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      username: username,
      password: password
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = require('http').request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data.toString(),
          headers: res.headers
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function testBranchLogins() {
  console.log('🧪 Testing Branch User Logins...\n');

  const testUsers = [
    { username: 'main_branch', password: 'admin123', expected: 'main_branch' },
    { username: 'branch1', password: 'admin123', expected: 'branch_user' },
    { username: 'branch2', password: 'admin123', expected: 'branch_user' },
    { username: 'branch3', password: 'admin123', expected: 'branch_user' }
  ];

  for (const testUser of testUsers) {
    try {
      console.log(`Testing: ${testUser.username}`);
      const result = await testLogin(testUser.username, testUser.password);
      
      if (result.status === 200) {
        const userData = JSON.parse(result.data);
        console.log(`✅ ${testUser.username} - SUCCESS`);
        console.log(`   Role: ${userData.user.role}`);
        console.log(`   Branch: ${userData.user.branchName || 'N/A'}`);
      } else {
        console.log(`❌ ${testUser.username} - FAILED (${result.status})`);
        console.log(`   Response: ${result.data}`);
      }
    } catch (error) {
      console.log(`💥 ${testUser.username} - ERROR: ${error.message}`);
    }
    console.log('');
  }
}

// Run the test
testBranchLogins().then(() => {
  console.log('✅ Branch login test complete!');
}).catch((error) => {
  console.error('💥 Test failed:', error);
});