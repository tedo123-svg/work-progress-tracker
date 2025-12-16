import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Load environment variables from backend directory
dotenv.config({ path: './backend/.env' });

// Import the database connection
import('./backend/src/database/db.js').then(async (dbModule) => {
  const pool = dbModule.default;
  await debugPasswords(pool);
}).catch(err => {
  console.error('Error importing database module:', err);
  process.exit(1);
});

async function debugPasswords(pool) {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Debugging password hashes...\n');
    
    // Get all sector users
    const usersResult = await client.query(`
      SELECT username, password, role, sector 
      FROM users 
      WHERE role LIKE '%sector%'
      ORDER BY username
    `);
    
    console.log('Found sector users:', usersResult.rows.length);
    
    for (const user of usersResult.rows) {
      console.log(`\nUser: ${user.username}`);
      console.log(`Role: ${user.role}`);
      console.log(`Sector: ${user.sector}`);
      console.log(`Password hash: ${user.password}`);
      
      // Test with the expected password
      const testPassword = 'sector123';
      const isMatch = await bcrypt.compare(testPassword, user.password);
      console.log(`Password "sector123" matches: ${isMatch}`);
      
      // Generate a new hash for comparison
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log(`New hash for comparison: ${newHash}`);
      
      // Test the new hash
      const newHashMatches = await bcrypt.compare(testPassword, newHash);
      console.log(`New hash works: ${newHashMatches}`);
    }
    
    // Let's also check if there are any other users with working passwords
    console.log('\n🔍 Checking other users for comparison...');
    const allUsersResult = await client.query(`
      SELECT username, password, role 
      FROM users 
      WHERE role IN ('main_branch', 'admin', 'branch_user')
      LIMIT 3
    `);
    
    for (const user of allUsersResult.rows) {
      console.log(`\nUser: ${user.username} (${user.role})`);
      console.log(`Password hash: ${user.password}`);
    }
    
  } catch (error) {
    console.error('❌ Error debugging passwords:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}