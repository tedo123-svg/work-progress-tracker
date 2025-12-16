import bcrypt from 'bcryptjs';

import dotenv from 'dotenv';

// Load environment variables from backend directory
dotenv.config({ path: './backend/.env' });

// Import the database connection
import('./backend/src/database/db.js').then(async (dbModule) => {
  const pool = dbModule.default;
  await createSectorUsers(pool);
}).catch(err => {
  console.error('Error importing database module:', err);
  process.exit(1);
});

async function createSectorUsers(pool) {
  const client = await pool.connect();
  
  try {
    console.log('Creating sector users...');
    
    // Hash password for all sector users (password: "sector123")
    const hashedPassword = await bcrypt.hash('sector123', 10);
    
    // First, update the role constraint
    await client.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
      ALTER TABLE users ADD CONSTRAINT users_role_check 
      CHECK (role IN ('admin', 'main_branch', 'branch_user', 'organization_sector', 'information_sector', 'operation_sector', 'peace_value_sector'));
    `);
    
    // Add sector column if it doesn't exist
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS sector VARCHAR(50);
    `);
    
    // Add sector column to annual_plans if it doesn't exist
    await client.query(`
      ALTER TABLE annual_plans ADD COLUMN IF NOT EXISTS sector VARCHAR(50);
    `);
    
    // Insert sector users
    const sectorUsers = [
      {
        username: 'organization_admin',
        role: 'organization_sector',
        branch_name: 'Organization Sector',
        email: 'organization@example.com',
        sector: 'organization'
      },
      {
        username: 'information_admin',
        role: 'information_sector',
        branch_name: 'Information Sector',
        email: 'information@example.com',
        sector: 'information'
      },
      {
        username: 'operation_admin',
        role: 'operation_sector',
        branch_name: 'Operation Sector',
        email: 'operation@example.com',
        sector: 'operation'
      },
      {
        username: 'peace_value_admin',
        role: 'peace_value_sector',
        branch_name: 'Peace and Value Sector',
        email: 'peacevalue@example.com',
        sector: 'peace_value'
      }
    ];
    
    for (const user of sectorUsers) {
      try {
        await client.query(
          `INSERT INTO users (username, password, role, branch_name, email, sector) 
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (username) DO UPDATE SET
           role = EXCLUDED.role,
           branch_name = EXCLUDED.branch_name,
           email = EXCLUDED.email,
           sector = EXCLUDED.sector`,
          [user.username, hashedPassword, user.role, user.branch_name, user.email, user.sector]
        );
        console.log(`✅ Created/Updated user: ${user.username}`);
      } catch (err) {
        console.error(`❌ Error creating user ${user.username}:`, err.message);
      }
    }
    
    // Update existing main_branch user to have organization sector
    await client.query(`
      UPDATE users SET sector = 'organization' 
      WHERE role = 'main_branch' AND sector IS NULL
    `);
    
    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_sector ON users(sector);
      CREATE INDEX IF NOT EXISTS idx_annual_plans_sector ON annual_plans(sector);
    `);
    
    console.log('\n🎉 Sector users created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Organization Sector: username=organization_admin, password=sector123');
    console.log('Information Sector: username=information_admin, password=sector123');
    console.log('Operation Sector: username=operation_admin, password=sector123');
    console.log('Peace & Value Sector: username=peace_value_admin, password=sector123');
    
  } catch (error) {
    console.error('❌ Error creating sector users:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}