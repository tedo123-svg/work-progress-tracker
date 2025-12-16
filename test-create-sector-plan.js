import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables from backend directory
dotenv.config({ path: './backend/.env' });

async function testCreateSectorPlan() {
  try {
    console.log('🧪 Testing sector plan creation and visibility...\n');
    
    // Step 1: Login as organization sector admin
    console.log('🔐 Step 1: Login as organization sector admin...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'organization_admin',
        password: 'sector123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');
    
    // Step 2: Create a test plan
    console.log('📝 Step 2: Creating test plan...');
    const planData = {
      title: 'Test Organization Plan',
      title_amharic: 'የሙከራ ድርጅት እቅድ',
      goal_amharic: 'የድርጅት ዘርፍ ሙከራ ግብ',
      description_amharic: 'ይህ የሙከራ እቅድ ነው',
      year: 2025,
      month: 1,
      plan_type: 'amharic_structured',
      activities: [
        {
          activity_number: '1.1',
          activity_title_amharic: 'የሙከራ እንቅስቃሴ አንድ',
          target_number: 100,
          target_unit_amharic: 'ሰዎች'
        },
        {
          activity_number: '1.2',
          activity_title_amharic: 'የሙከራ እንቅስቃሴ ሁለት',
          target_number: 50,
          target_unit_amharic: 'ስልጠናዎች'
        }
      ]
    };
    
    const createResponse = await fetch('http://localhost:5000/api/annual-plans/amharic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(planData)
    });
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Plan creation failed: ${createResponse.status} - ${errorText}`);
    }
    
    const createData = await createResponse.json();
    console.log('✅ Plan created successfully');
    console.log(`📄 Plan ID: ${createData.plan.id}`);
    console.log(`🎯 Sector: ${createData.plan.sector}`);
    
    // Step 3: Test visibility for different user types
    console.log('\n👥 Step 3: Testing plan visibility...');
    
    const testUsers = [
      { username: 'woreda1_organization', password: 'woreda123', description: 'Woreda 1 Organization', shouldSee: true },
      { username: 'woreda2_organization', password: 'woreda123', description: 'Woreda 2 Organization', shouldSee: true },
      { username: 'woreda1_information', password: 'woreda123', description: 'Woreda 1 Information', shouldSee: false },
      { username: 'information_admin', password: 'sector123', description: 'Information Sector Admin', shouldSee: false }
    ];
    
    for (const testUser of testUsers) {
      console.log(`\n🔍 Testing ${testUser.description}...`);
      
      // Login as test user
      const userLoginResponse = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: testUser.username,
          password: testUser.password
        })
      });
      
      if (!userLoginResponse.ok) {
        console.log(`❌ Login failed for ${testUser.username}`);
        continue;
      }
      
      const userLoginData = await userLoginResponse.json();
      const userToken = userLoginData.token;
      
      // Get plans visible to this user
      const plansResponse = await fetch('http://localhost:5000/api/annual-plans', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      
      if (!plansResponse.ok) {
        console.log(`❌ Failed to get plans for ${testUser.username}`);
        continue;
      }
      
      const plansData = await plansResponse.json();
      const organizationPlans = plansData.filter(plan => 
        plan.plan_type === 'amharic_structured' && 
        plan.sector === 'organization'
      );
      
      if (testUser.shouldSee) {
        if (organizationPlans.length > 0) {
          console.log(`✅ Can see ${organizationPlans.length} organization plan(s) - CORRECT`);
        } else {
          console.log(`❌ Cannot see organization plans - INCORRECT`);
        }
      } else {
        if (organizationPlans.length === 0) {
          console.log(`✅ Cannot see organization plans - CORRECT`);
        } else {
          console.log(`❌ Can see ${organizationPlans.length} organization plan(s) - INCORRECT`);
        }
      }
    }
    
    console.log('\n🎉 Test completed!');
    
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
    console.log('💡 Please start the backend server first: npm run dev');
    process.exit(1);
  } else {
    console.log('✅ Backend server is running');
    testCreateSectorPlan();
  }
});