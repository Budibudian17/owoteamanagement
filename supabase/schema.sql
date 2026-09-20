-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Members table
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  base_salary NUMERIC NOT NULL DEFAULT 0,
  multiplier NUMERIC NOT NULL DEFAULT 1,
  bonus NUMERIC NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Materials table (for reference)
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Day data table
CREATE TABLE IF NOT EXISTS day_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  cups INTEGER NOT NULL DEFAULT 0,
  price_per_cup NUMERIC NOT NULL DEFAULT 0,
  revenue NUMERIC NOT NULL DEFAULT 0,
  payroll_mode TEXT NOT NULL DEFAULT 'share',
  salary_share_pct NUMERIC NOT NULL DEFAULT 50,
  capital_mode TEXT NOT NULL DEFAULT 'detail',
  manual_capital NUMERIC NOT NULL DEFAULT 0,
  manual_payroll NUMERIC NOT NULL DEFAULT 0,
  is_holiday BOOLEAN NOT NULL DEFAULT false,
  -- Store daily materials as JSONB
  materials JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Store daily members with their daily state as JSONB
  members JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_day_data_date ON day_data(date);
CREATE INDEX IF NOT EXISTS idx_members_active ON members(active);

-- Enable Row Level Security
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_data ENABLE ROW LEVEL SECURITY;

-- App settings table for opening capital and payroll
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for settings key
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);

-- Enable RLS on app_settings
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Policies for app_settings
CREATE POLICY "Enable all access for app_settings" ON app_settings FOR ALL 
USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('members', 'materials', 'day_data', 'app_settings');

-- Create policies (you can customize these based on your auth needs)
-- For now, allow all operations (you should restrict this in production)
CREATE POLICY "Enable all access for all users" ON members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON day_data FOR ALL USING (true) WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to update updated_at
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_day_data_updated_at BEFORE UPDATE ON day_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
