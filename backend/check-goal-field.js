import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

// Configure SSL for Supabase or other cloud databases
const sslConfig = process.env.DB_SSL === 'true' ? {
  rejectUnauthorized: false
} : false;

// Support both individual env vars and DATABASE_URL
const pool = new Pool(
  process.env.DATABASE_URL ? {
    connectionString: process.env.DATABASE_URL,
    ssl: sslConfig,
  } : {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: sslConfig,
  }
);

async function runMigration() {
  try {
    console.log('Checking database connection...');
    
    // First check if goal_amharic column exists
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'annual_plans' 
      AND column_name = 'goal_amharic'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ goal_amharic column already exists');
    } else {
      console.log('❌ goal_amharic column does not exist, adding it...');
      
      // Add the goal_amharic column
      await pool.query('ALTER TABLE annual_plans ADD COLUMN goal_amharic TEXT');
      console.log('✅ Added goal_amharic column');
      
      // Update existing plans to have a default goal if needed
      const updateResult = await pool.query(`
        UPDATE annual_plans 
        SET goal_amharic = plan_title_amharic 
        WHERE goal_amharic IS NULL AND plan_title_amharic IS NOT NULL
      `);
      console.log(`✅ Updated ${updateResult.rowCount} existing plans with default goals`);
    }
    
    // Show current table structure
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'annual_plans' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Current annual_plans table structure:');
    columnsResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check if there are any existing Amharic plans
    const plansResult = await pool.query(`
      SELECT id, title, plan_title_amharic, goal_amharic, plan_type 
      FROM annual_plans 
      WHERE plan_type = 'amharic_structured'
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log('\n📋 Existing Amharic plans:');
    if (plansResult.rows.length === 0) {
      console.log('  No Amharic plans found');
    } else {
      plansResult.rows.forEach(plan => {
        console.log(`  ID: ${plan.id}, Title: ${plan.title}`);
        console.log(`    Amharic Title: ${plan.plan_title_amharic || 'NULL'}`);
        console.log(`    Goal: ${plan.goal_amharic || 'NULL'}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await pool.end();
  }
}

runMigration();