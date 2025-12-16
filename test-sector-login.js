import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Load environment variables from backend directory
dotenv.config({ path: './backend/.env' });

// Import the database connection
import('./backend/src/database/db.js').then(async (dbModule) => {
  const pool = dbModule.default;
  await testSectorLogin(pool);
}).catch(err => {
  console.error('Error importing database module:', err);
  process.exit(1);
});

async function testSectorLogin(pool) {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing sector user login credentials...\n');
    
    const testCredentials = [
      { username: 'organization_admin', password: 'sector123', expectedRole: 'organization_sector' },
      { username: 'information_admin', password: 'sector123', expectedRole: 'information_sector' },
      { username: 'operation_admin', password: 'sector123', expectedRole: 'operation_sector' },
      { username: 'peace_value_admin', password: 'sector123', expectedRole: 'peace_value_sector' }
    ];
    
    for (const cred of testCredentials) {
      console.log(`Testing ${cred.username}...`);
      
      // Get user from database
      const userResult = await client.query(
        'SELECT username, password, role, sector, branch_name FROM users WHERE username = $1',
        [cred.username]
      );
      
      if (userResult.rows.length === 0) {
        console.log(`❌ User ${cred.username} not found in database`);
        continue;
      }
      
      const user = userResult.rows[0];
      
      // Test password
      const passwordMatch = await bcrypt.compare(cred.password, user.password);
      
      if (passwordMatch) {
        console.log(`✅ ${cred.username} - Password correct`);
        console.log(`   Role: ${user.role} (expected: ${cred.expectedRole})`);
        console.log(`   Sector: ${user.sector}`);
        console.log(`   Branch: ${user.branch_name}`);
        
        if (user.role === cred.expectedRole) {
          console.log(`✅ Role matches expected value`);
        } else {
          console.log(`❌ Role mismatch! Expected: ${cred.expectedRole}, Got: ${user.role}`);
        }
      } else {
        console.log(`❌ ${cred.username} - Password incorrect`);
      }
      
      console.log(''); // Empty line for readability
    }
    
    console.log('🎯 Test Summary:');
    console.log('================');
    console.log('All sector users should be able to login with password "sector123"');
    console.log('Each user should have their corresponding sector role');
    console.log('Frontend should show different dashboards based on user role');
    
  } catch (error) {
    console.error('❌ Error testing login:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}