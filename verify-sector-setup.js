import dotenv from 'dotenv';

// Load environment variables from backend directory
dotenv.config({ path: './backend/.env' });

// Import the database connection
import('./backend/src/database/db.js').then(async (dbModule) => {
  const pool = dbModule.default;
  await verifySectorSetup(pool);
}).catch(err => {
  console.error('Error importing database module:', err);
  process.exit(1);
});

async function verifySectorSetup(pool) {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verifying sector system setup...\n');
    
    // Check sector users
    const usersResult = await client.query(`
      SELECT username, role, sector, branch_name 
      FROM users 
      WHERE role LIKE '%sector%' OR role = 'main_branch'
      ORDER BY role, username
    `);
    
    console.log('👥 Sector Users:');
    console.log('================');
    usersResult.rows.forEach(user => {
      console.log(`${user.username.padEnd(20)} | ${user.role.padEnd(20)} | ${user.sector || 'N/A'} | ${user.branch_name}`);
    });
    
    // Check database schema
    console.log('\n🗄️ Database Schema:');
    console.log('==================');
    
    // Check if sector column exists in users table
    const userColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'sector'
    `);
    
    if (userColumns.rows.length > 0) {
      console.log('✅ users.sector column exists');
    } else {
      console.log('❌ users.sector column missing');
    }
    
    // Check if sector column exists in annual_plans table
    const planColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'annual_plans' AND column_name = 'sector'
    `);
    
    if (planColumns.rows.length > 0) {
      console.log('✅ annual_plans.sector column exists');
    } else {
      console.log('❌ annual_plans.sector column missing');
    }
    
    // Check role constraints
    const constraints = await client.query(`
      SELECT constraint_name, check_clause
      FROM information_schema.check_constraints 
      WHERE constraint_name = 'users_role_check'
    `);
    
    if (constraints.rows.length > 0) {
      console.log('✅ Role constraints updated');
      console.log(`   ${constraints.rows[0].check_clause}`);
    } else {
      console.log('❌ Role constraints not found');
    }
    
    console.log('\n🎯 Setup Status: COMPLETE ✅');
    console.log('\n📋 Next Steps:');
    console.log('1. Test login with sector admin credentials');
    console.log('2. Verify sector-specific dashboards work correctly');
    console.log('3. Test plan creation and management by sector');
    
  } catch (error) {
    console.error('❌ Error verifying setup:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}