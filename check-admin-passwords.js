import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Load environment variables from backend directory
dotenv.config({ path: './backend/.env' });

// Import the database connection
import('./backend/src/database/db.js').then(async (dbModule) => {
  const pool = dbModule.default;
  await checkAdminPasswords(pool);
}).catch(err => {
  console.error('Error importing database module:', err);
  process.exit(1);
});

async function checkAdminPasswords(pool) {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking admin and main_branch passwords...\n');
    
    // Common passwords to try
    const commonPasswords = [
      'admin123', 'admin', 'password', 'main123', 'main_branch', 
      'branch123', '123456', 'password123', 'admin1234'
    ];
    
    const usersToCheck = ['admin', 'main_branch'];
    
    for (const username of usersToCheck) {
      console.log(`Checking ${username}...`);
      
      const userResult = await client.query(
        'SELECT username, password, role FROM users WHERE username = $1',
        [username]
      );
      
      if (userResult.rows.length === 0) {
        console.log(`❌ User ${username} not found`);
        continue;
      }
      
      const user = userResult.rows[0];
      console.log(`📋 Found user: ${user.username} (${user.role})`);
      console.log(`🔐 Password hash: ${user.password}`);
      
      let passwordFound = false;
      
      for (const testPassword of commonPasswords) {
        const isMatch = await bcrypt.compare(testPassword, user.password);
        if (isMatch) {
          console.log(`✅ Password found: ${testPassword}`);
          passwordFound = true;
          break;
        }
      }
      
      if (!passwordFound) {
        console.log(`❌ Password not found in common list`);
        console.log(`💡 You may need to reset the password for ${username}`);
      }
      
      console.log('');
    }
    
    // Show how to reset passwords
    console.log('🔧 To reset passwords, you can:');
    console.log('1. Use the admin dashboard to reset passwords');
    console.log('2. Or run a manual update query');
    console.log('\nExample to set admin password to "admin123":');
    console.log('UPDATE users SET password = $1 WHERE username = \'admin\';');
    
    // Generate new hash for reference
    const newHash = await bcrypt.hash('admin123', 10);
    console.log(`\nNew hash for "admin123": ${newHash}`);
    
  } catch (error) {
    console.error('❌ Error checking passwords:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}