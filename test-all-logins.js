import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Load environment variables from backend directory
dotenv.config({ path: './backend/.env' });

// Import the database connection
import('./backend/src/database/db.js').then(async (dbModule) => {
  const pool = dbModule.default;
  await testAllLogins(pool);
}).catch(err => {
  console.error('Error importing database module:', err);
  process.exit(1);
});

async function testAllLogins(pool) {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing all user login credentials...\n');
    
    // Test credentials for all user types
    const testCredentials = [
      // Admin
      { username: 'admin', password: 'admin123', expectedRole: 'admin', description: 'System Admin' },
      
      // Main Branch
      { username: 'main_branch', password: 'main123', expectedRole: 'main_branch', description: 'Sub-city Main Branch' },
      
      // Sub-city Sector Admins
      { username: 'organization_admin', password: 'sector123', expectedRole: 'organization_sector', description: 'Sub-city Organization Sector' },
      { username: 'information_admin', password: 'sector123', expectedRole: 'information_sector', description: 'Sub-city Information Sector' },
      { username: 'operation_admin', password: 'sector123', expectedRole: 'operation_sector', description: 'Sub-city Operation Sector' },
      { username: 'peace_value_admin', password: 'sector123', expectedRole: 'peace_value_sector', description: 'Sub-city Peace & Value Sector' },
      
      // Woreda Sector Users
      { username: 'woreda1_organization', password: 'woreda123', expectedRole: 'woreda_organization', description: 'Woreda 1 Organization' },
      { username: 'woreda1_information', password: 'woreda123', expectedRole: 'woreda_information', description: 'Woreda 1 Information' },
      { username: 'woreda1_operation', password: 'woreda123', expectedRole: 'woreda_operation', description: 'Woreda 1 Operation' },
      { username: 'woreda1_peace_value', password: 'woreda123', expectedRole: 'woreda_peace_value', description: 'Woreda 1 Peace & Value' },
      
      { username: 'woreda2_organization', password: 'woreda123', expectedRole: 'woreda_organization', description: 'Woreda 2 Organization' },
      { username: 'woreda2_information', password: 'woreda123', expectedRole: 'woreda_information', description: 'Woreda 2 Information' },
      { username: 'woreda2_operation', password: 'woreda123', expectedRole: 'woreda_operation', description: 'Woreda 2 Operation' },
      { username: 'woreda2_peace_value', password: 'woreda123', expectedRole: 'woreda_peace_value', description: 'Woreda 2 Peace & Value' }
    ];
    
    let passedTests = 0;
    let failedTests = 0;
    
    for (const cred of testCredentials) {
      console.log(`Testing ${cred.description} (${cred.username})...`);
      
      try {
        // Get user from database
        const userResult = await client.query(
          'SELECT username, password, role, sector, branch_name FROM users WHERE username = $1',
          [cred.username]
        );
        
        if (userResult.rows.length === 0) {
          console.log(`❌ User ${cred.username} not found in database`);
          failedTests++;
          continue;
        }
        
        const user = userResult.rows[0];
        
        // Test password
        const passwordMatch = await bcrypt.compare(cred.password, user.password);
        
        if (passwordMatch) {
          console.log(`✅ Password correct`);
          
          // Check role
          if (user.role === cred.expectedRole) {
            console.log(`✅ Role matches: ${user.role}`);
            
            // Show additional info
            if (user.sector) {
              console.log(`📍 Sector: ${user.sector}`);
            }
            if (user.branch_name) {
              console.log(`🏢 Branch: ${user.branch_name}`);
            }
            
            console.log(`✅ ${cred.description} - ALL TESTS PASSED`);
            passedTests++;
          } else {
            console.log(`❌ Role mismatch! Expected: ${cred.expectedRole}, Got: ${user.role}`);
            failedTests++;
          }
        } else {
          console.log(`❌ Password incorrect for ${cred.username}`);
          failedTests++;
        }
        
      } catch (error) {
        console.log(`❌ Error testing ${cred.username}:`, error.message);
        failedTests++;
      }
      
      console.log(''); // Empty line for readability
    }
    
    // Summary
    console.log('🎯 Test Summary:');
    console.log('================');
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`📊 Total: ${passedTests + failedTests}`);
    
    if (failedTests === 0) {
      console.log('\n🎉 ALL LOGIN TESTS PASSED!');
      console.log('🔐 All user credentials are working correctly');
    } else {
      console.log(`\n⚠️  ${failedTests} tests failed - check the issues above`);
    }
    
    // Show all users in database for reference
    console.log('\n📋 All Users in Database:');
    console.log('=========================');
    const allUsers = await client.query(`
      SELECT username, role, sector, branch_name, created_at 
      FROM users 
      ORDER BY role, sector, username
    `);
    
    allUsers.rows.forEach(user => {
      console.log(`${user.username.padEnd(25)} | ${user.role.padEnd(20)} | ${(user.sector || 'N/A').padEnd(12)} | ${user.branch_name || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('❌ Error testing logins:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}