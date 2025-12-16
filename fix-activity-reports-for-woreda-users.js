import dotenv from 'dotenv';

// Load environment variables from backend directory
dotenv.config({ path: './backend/.env' });

// Import the database connection
import('./backend/src/database/db.js').then(async (dbModule) => {
  const pool = dbModule.default;
  await fixActivityReportsForWoredaUsers(pool);
}).catch(err => {
  console.error('Error importing database module:', err);
  process.exit(1);
});

async function fixActivityReportsForWoredaUsers(pool) {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing activity reports for woreda sector users...\n');
    
    // Get all Amharic plans with their sectors
    const plans = await client.query(`
      SELECT ap.id, ap.title, ap.sector, ap.created_at
      FROM annual_plans ap
      WHERE ap.plan_type = 'amharic_structured' AND ap.sector IS NOT NULL
      ORDER BY ap.created_at DESC
    `);
    
    console.log(`Found ${plans.rows.length} Amharic plans with sectors:`);
    plans.rows.forEach(plan => {
      console.log(`📄 ${plan.title} (Sector: ${plan.sector})`);
    });
    console.log('');
    
    let totalReportsCreated = 0;
    
    for (const plan of plans.rows) {
      console.log(`🔄 Processing plan: ${plan.title} (${plan.sector} sector)`);
      
      // Get activities for this plan
      const activities = await client.query(`
        SELECT id, activity_number, activity_title_amharic
        FROM plan_activities
        WHERE annual_plan_id = $1
        ORDER BY sort_order
      `, [plan.id]);
      
      console.log(`   Found ${activities.rows.length} activities`);
      
      // Get monthly periods for this plan
      const periods = await client.query(`
        SELECT id, month, year
        FROM monthly_periods
        WHERE annual_plan_id = $1
        ORDER BY month
      `, [plan.id]);
      
      console.log(`   Found ${periods.rows.length} monthly periods`);
      
      // Get woreda users that match this plan's sector
      const woredaUsers = await client.query(`
        SELECT id, username, role, sector, branch_name
        FROM users
        WHERE role LIKE 'woreda_%' AND sector = $1
        ORDER BY username
      `, [plan.sector]);
      
      console.log(`   Found ${woredaUsers.rows.length} matching woreda users:`);
      woredaUsers.rows.forEach(user => {
        console.log(`     - ${user.username} (${user.branch_name})`);
      });
      
      // Create activity reports for each combination
      let planReportsCreated = 0;
      
      for (const period of periods.rows) {
        for (const activity of activities.rows) {
          for (const user of woredaUsers.rows) {
            // Check if report already exists
            const existingReport = await client.query(`
              SELECT id FROM activity_reports
              WHERE plan_activity_id = $1 AND monthly_period_id = $2 AND branch_user_id = $3
            `, [activity.id, period.id, user.id]);
            
            if (existingReport.rows.length === 0) {
              // Create the activity report
              await client.query(`
                INSERT INTO activity_reports (plan_activity_id, monthly_period_id, branch_user_id, achieved_number, achievement_percentage)
                VALUES ($1, $2, $3, $4, $5)
              `, [activity.id, period.id, user.id, 0, 0]);
              
              planReportsCreated++;
              totalReportsCreated++;
            }
          }
        }
      }
      
      console.log(`   ✅ Created ${planReportsCreated} activity reports for this plan`);
      console.log('');
    }
    
    console.log(`🎉 Total activity reports created: ${totalReportsCreated}`);
    
    // Verify the results
    console.log('\n📊 Verification - Activity reports by sector:');
    const verification = await client.query(`
      SELECT 
        ap.sector,
        COUNT(DISTINCT ap.id) as plans,
        COUNT(DISTINCT u.id) as woreda_users,
        COUNT(ar.id) as activity_reports
      FROM annual_plans ap
      JOIN plan_activities pa ON ap.id = pa.annual_plan_id
      JOIN activity_reports ar ON pa.id = ar.plan_activity_id
      JOIN users u ON ar.branch_user_id = u.id
      WHERE ap.plan_type = 'amharic_structured' 
        AND ap.sector IS NOT NULL
        AND u.role LIKE 'woreda_%'
        AND u.sector = ap.sector
      GROUP BY ap.sector
      ORDER BY ap.sector
    `);
    
    verification.rows.forEach(row => {
      console.log(`📈 ${row.sector.toUpperCase()}: ${row.plans} plans, ${row.woreda_users} users, ${row.activity_reports} reports`);
    });
    
    console.log('\n✅ Fix completed! Woreda users should now see activity reports for their sector plans.');
    
  } catch (error) {
    console.error('❌ Error fixing activity reports:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}