import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Load environment variables from backend directory
dotenv.config({ path: './backend/.env' });

// Import the database connection
import('./backend/src/database/db.js').then(async (dbModule) => {
  const pool = dbModule.default;
  await fixSectorPasswords(pool);
}).catch(err => {
  console.error('Error importing database module:', err);
  process.exit(1);
});

async function fixSectorPasswords(pool) {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing sector user passwords...\n');
    
    // Generate a proper hash for "sector123"
    const correctPassword = 'sector123';
    const hashedPassword = await bcrypt.hash(correctPassword, 10);
    
    console.log(`Generated new hash: ${hashedPassword}`);
    
    // Test the new hash works
    const testHash = await bcrypt.compare(correctPassword, hashedPassword);
    console.log(`New hash verification: ${testHash}\n`);
    
    const sectorUsers = [
      'organization_admin',
      'information_admin', 
      'operation_admin',
      'peace_value_admin'
    ];
    
    for (const username of sectorUsers) {
      try {
        await client.query(
          'UPDATE users SET password = $1 WHERE username = $2',
          [hashedPassword, username]
        );
        console.log(`✅ Updated password for ${username}`);
      } catch (err) {
        console.error(`❌ Error updating ${username}:`, err.message);
      }
    }
    
    console.log('\n🧪 Testing updated passwords...');
    
    for (const username of sectorUsers) {
      const userResult = await client.query(
        'SELECT username, password FROM users WHERE username = $1',
        [username]
      );
      
      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        const passwordMatch = await bcrypt.compare(correctPassword, user.password);
        console.log(`${username}: ${passwordMatch ? '✅ Password works' : '❌ Password failed'}`);
      }
    }
    
    console.log('\n🎉 Password fix complete!');
    console.log('\n📋 Updated Login Credentials:');
    console.log('Organization Sector: username=organization_admin, password=sector123');
    console.log('Information Sector: username=information_admin, password=sector123');
    console.log('Operation Sector: username=operation_admin, password=sector123');
    console.log('Peace & Value Sector: username=peace_value_admin, password=sector123');
    
  } catch (error) {
    console.error('❌ Error fixing passwords:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}