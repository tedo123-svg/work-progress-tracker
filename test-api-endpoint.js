import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables from backend directory
dotenv.config({ path: './backend/.env' });

async function testAPIEndpoint() {
  try {
    console.log('🧪 Testing API endpoint access for woreda users...\n');
    
    const baseURL = 'http://localhost:5000';
    
    // Test 1: Login as woreda organization user
    console.log('🔐 Step 1: Login as woreda1_organization...');
    const loginResponse = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'woreda1_organization',
        password: 'woreda123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');
    console.log(`👤 User: ${loginData.user.username} (${loginData.user.role})`);
    console.log(`🏢 Branch: ${loginData.user.branch_name}`);
    console.log(`📍 Sector: ${loginData.user.sector}`);
    
    // Test 2: Call the annual plans API
    console.log('\n📋 Step 2: Fetching annual plans...');
    const plansResponse = await fetch(`${baseURL}/api/annual-plans`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`API Response Status: ${plansResponse.status}`);
    
    if (!plansResponse.ok) {
      const errorText = await plansResponse.text();
      throw new Error(`API call failed: ${plansResponse.status} - ${errorText}`);
    }
    
    const plansData = await plansResponse.json();
    console.log(`✅ API call successful - received ${plansData.length} plans`);
    
    // Filter for Amharic plans
    const amharicPlans = plansData.filter(plan => plan.plan_type === 'amharic_structured');
    console.log(`📄 Amharic plans: ${amharicPlans.length}`);
    
    amharicPlans.forEach(plan => {
      console.log(`   - ${plan.title} (ID: ${plan.id}, Sector: ${plan.sector})`);
    });
    
    if (amharicPlans.length === 0) {
      console.log('❌ No Amharic plans found - this explains why the dashboard shows 0');
    } else {
      console.log('✅ Amharic plans found - dashboard should show these');
    }
    
    // Test 3: Compare with organization admin
    console.log('\n🔐 Step 3: Testing organization admin for comparison...');
    const adminLoginResponse = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'organization_admin',
        password: 'sector123'
      })
    });
    
    if (adminLoginResponse.ok) {
      const adminLoginData = await adminLoginResponse.json();
      const adminToken = adminLoginData.token;
      
      const adminPlansResponse = await fetch(`${baseURL}/api/annual-plans`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (adminPlansResponse.ok) {
        const adminPlansData = await adminPlansResponse.json();
        const adminAmharicPlans = adminPlansData.filter(plan => plan.plan_type === 'amharic_structured');
        console.log(`📄 Organization admin sees ${adminAmharicPlans.length} Amharic plans`);
        
        if (adminAmharicPlans.length === amharicPlans.length) {
          console.log('✅ Both users see the same number of plans - correct!');
        } else {
          console.log('❌ Different number of plans - there may be an issue');
        }
      }
    }
    
    console.log('\n🎯 Summary:');
    console.log('===========');
    if (amharicPlans.length > 0) {
      console.log('✅ API is working correctly');
      console.log('✅ Woreda user can access plans');
      console.log('💡 If dashboard still shows 0, try:');
      console.log('   1. Refresh the browser page');
      console.log('   2. Clear browser cache');
      console.log('   3. Check browser console for errors');
    } else {
      console.log('❌ No plans found - this explains the dashboard issue');
      console.log('💡 Create a plan using organization_admin first');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Check if backend is running first
async function checkBackend() {
  try {
    const response = await fetch('http://localhost:5000/api/health');
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Run the test
checkBackend().then(isRunning => {
  if (!isRunning) {
    console.log('❌ Backend server is not running on http://localhost:5000');
    console.log('💡 Please start the backend server first');
    console.log('   cd backend && npm run dev');
    process.exit(1);
  } else {
    console.log('✅ Backend server is running');
    testAPIEndpoint();
  }
});