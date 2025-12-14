-- Enhanced Amharic Plan Structure
-- This adds support for hierarchical Amharic plans with sub-activities

-- Enhanced Annual Plans with Amharic structure
ALTER TABLE annual_plans ADD COLUMN IF NOT EXISTS plan_title_amharic TEXT;
ALTER TABLE annual_plans ADD COLUMN IF NOT EXISTS plan_description_amharic TEXT;
ALTER TABLE annual_plans ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50) DEFAULT 'standard';
ALTER TABLE annual_plans ADD COLUMN IF NOT EXISTS plan_month INTEGER DEFAULT 1;

-- Plan Activities Table (hierarchical structure like 3.2.1, 3.2.2)
CREATE TABLE IF NOT EXISTS plan_activities (
    id SERIAL PRIMARY KEY,
    annual_plan_id INTEGER REFERENCES annual_plans(id) ON DELETE CASCADE,
    activity_number VARCHAR(20) NOT NULL, -- e.g., "3.2.1", "3.2.2"
    activity_title_amharic TEXT NOT NULL,
    activity_description_amharic TEXT,
    target_number INTEGER DEFAULT 0,
    target_unit_amharic VARCHAR(100), -- e.g., "ሰዎች", "ቤተሰቦች"
    parent_activity_id INTEGER REFERENCES plan_activities(id),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity Reports (for each branch to report on specific activities)
CREATE TABLE IF NOT EXISTS activity_reports (
    id SERIAL PRIMARY KEY,
    plan_activity_id INTEGER REFERENCES plan_activities(id) ON DELETE CASCADE,
    monthly_period_id INTEGER REFERENCES monthly_periods(id) ON DELETE CASCADE,
    branch_user_id INTEGER REFERENCES users(id),
    achieved_number INTEGER DEFAULT 0,
    achievement_percentage DECIMAL(5, 2) DEFAULT 0,
    notes_amharic TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'late')),
    submitted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Plan Templates (for common Amharic plan structures)
CREATE TABLE IF NOT EXISTS plan_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL,
    template_name_amharic VARCHAR(255) NOT NULL,
    template_structure JSONB, -- Stores the hierarchical structure
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_plan_activities_plan ON plan_activities(annual_plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_activities_parent ON plan_activities(parent_activity_id);
CREATE INDEX IF NOT EXISTS idx_plan_activities_number ON plan_activities(activity_number);
CREATE INDEX IF NOT EXISTS idx_activity_reports_activity ON activity_reports(plan_activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_reports_period ON activity_reports(monthly_period_id);
CREATE INDEX IF NOT EXISTS idx_activity_reports_user ON activity_reports(branch_user_id);

-- Sample plan template for the structure shown in your image
INSERT INTO plan_templates (template_name, template_name_amharic, template_structure) VALUES 
('Social Development Plan', 'የማህበራዊ የምክር ወደሊት እቅድ', 
'{
  "main_title": "ዓላማ፡- የማህበራዊ የምክር ወደሊት በማስተዋወቅ የማህበራዊ ያለተሳተፈ አባላት ተግባራዊ በማድረግ",
  "activities": [
    {
      "number": "3.2.1",
      "title": "12 ህብረተሰቦችን የሚሳተፉበትን የአላማና ዕየታ ርዕሰ ጉዳይ ጽሁፍን መልዕክት በቀጥር",
      "target": 1,
      "unit": "ክንውን"
    },
    {
      "number": "3.2.2", 
      "title": "የማህበራዊ ተክኖ ምክር በማስተዋወቅ በወደሊትና በወጣታ 1,317,376 የህብረተሰብ ክፍሎች በምክር ወደሊት ላይ ማሳተፍ፡",
      "target": 329344,
      "unit": "ሰዎች"
    },
    {
      "number": "3.2.3",
      "title": "የህዝብ የአካባቢ ቅጥር ጥበቦ ስራዎችን ምላመላ፡ ግንባታና ስምረት በምርት በማስተዋወቅ",
      "target": 97,
      "unit": "ስራዎች"
    }
  ]
}');