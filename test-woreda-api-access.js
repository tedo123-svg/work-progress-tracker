import dotenv from 'dotenv';

// Load environment variables from backend directory
dotenv.config({ path: './backend/.env' });

// Import the database connection
import('./backend/src/database/db.js').then(async (dbModule) => {
  const pool = dbModule.default;
  await testWoredaAPIAccess(pool);
}).catch(err => {
  console.error('Error importing database module:', err);
  process.exit(1);
});

async function testWoredaAPIAccess(pool) {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing API access for woreda users...\n');
    
    // Test the exact query that getAnnualPlans uses for different user types
    const testUsers = [
      { role: 'main_branch', description: 'Main Branch (should see all)' },
      { role: 'organization_sector', description: 'Sub-city Organization Admin' },
      { role: 'woreda_organization', description: 'Woreda Organization User' },
      { role: 'woreda_information', description: 'Woreda Information User' }
    ];
    
    for (const testUser of testUsers) {
      console.log(`🔍 Testing for ${testUser.description} (${testUser.role}):`);
      
      // Simulate the exact query from getAnnualPlans
      let query = `SELECT ap.*, u.username as creator_name 
                   FROM annual_plans ap
                   LEFT JOIN users u ON ap.created_by = u.id`;
      let params = [];
      
      // Apply the same filtering logic
      if (testUser.role !== 'main_branch') {
        const sectorMap = {
          'organization_sector': 'organization',
          'information_sector': 'information',
          'operation_sector': 'operation',
          'peace_value_sector': 'peace_value',
          'woreda_organization': 'organization',
          'woreda_information': 'information',
          'woreda_operation': 'operation',
          'woreda_peace_value': 'peace_value'
        };
        
        const userSector = sectorMap[testUser.role];
        if (userSector) {
          query += ` WHERE ap.sector = $1`;
          params.push(userSector);
          console.log(`   Filtering by sector: ${userSector}`);
        } else {
          console.log(`   No sector mapping found for role: ${testUser.role}`);
        }
      } else {
        console.log(`   No filtering (main_branch sees all)`);
      }
      
      query += ` ORDER BY ap.year DESC, ap.created_at DESC`;
      
      const result = await client.query(query, params);
      
      console.log(`   Results: ${result.rows.length} plans found`);
      result.rows.forEach(plan => {
        console.log(`   📄 ${plan.title} (Sector: ${plan.sector || 'null'}, Type: ${plan.plan_type || 'null'})`);
      });
      console.log('');
    }
    
    // Also test what specific woreda users should see
    console.log('👥 Testing actual woreda user access:');
    console.log('=====================================');
    
    const actualWoredaUsers = await client.query(`
      SELECT id, username, role, sector, branch_name
      FROM users 
      WHERE role LIKE 'woreda_%'
      ORDER BY username
    `);
    
    for (const user of actualWoredaUsers.rows) {
      console.log(`\n🔍 Testing ${user.username} (${user.role}, sector: ${user.sector}):`);
      
      // Test what plans they should see
      const userPlans = await client.query(`
        SELECT ap.id, ap.title, ap.plan_title_amharic, ap.sector, ap.plan_type
        FROM annual_plans ap
        WHERE ap.sector = $1 AND ap.plan_type = 'amharic_structured'
        ORDER BY ap.created_at DESC
      `, [user.sector]);
      
      console.log(`   Should see ${userPlans.rows.length} Amharic plans:`);
      userPlans.rows.forEach(plan => {
        console.log(`   ✅ ${plan.title} (ID: ${plan.id})`);
      });
      
      if (userPlans.rows.length === 0) {
        console.log(`   ❌ No plans found for sector: ${user.sector}`);
      }
    }
    
    // Check if there are any Amharic plans at all
    console.log('\n📊 All Amharic Plans in Database:');
    console.log('=================================');
    
    const allAmharicPlans = await client.query(`
      SELECT ap.id, ap.title, ap.sector, ap.plan_type, ap.created_at,
             u.username as creator, u.role as creator_role
      FROM annual_plans ap
      LEFT JOIN users u ON ap.created_by = u.id
      WHERE ap.plan_type = 'amharic_structured'
      ORDER BY ap.created_at DESC
    `);
    
    console.log(`Found ${allAmharicPlans.rows.length} Amharic plans:`);
    allAmharicPlans.rows.forEach(plan => {
      console.log(`📄 ID: ${plan.id} | Title: ${plan.title} | Sector: ${plan.sector || 'NULL'} | Creator: ${plan.creator} (${plan.creator_role})`);
    });
    
  } catch (error) {
    console.error('❌ Error testing woreda API access:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}