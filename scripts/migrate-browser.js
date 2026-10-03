// Migration script untuk browser console - Plain JavaScript version
// Copy dan paste ini langsung ke browser console

(function() {
  console.log('🚀 Memulai migrasi dari localStorage ke Supabase...');
  
  // Cek apakah Supabase URL dan key tersedia dari environment
  const supabaseUrl = 'https://lhkjuzfkdhluprkthcoo.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxoa2p1emZrZGhscHJrdGhjb28iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc4OTg5NzI4MywiZXhwIjoyMTA1NDczMjgzfQ.eXQK5wkSAHGNbLKcgxjwvxWHorufw5LJarS5WEo3BWk';
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase URL atau key tidak tersedia!');
    console.log('Pastikan .env sudah diisi dengan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY');
    return;
  }
  
  // Load Supabase client dari CDN
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
  script.onload = async () => {
    try {
      const { createClient } = window.supabase;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      console.log('✅ Supabase client connected');
      
      // LocalStorage keys
      const PREFIX = 'owo-tea:day:';
      const ROSTER_KEY = 'owo-tea:roster';
      const HOLIDAY_KEY = 'owo-tea:holidays';
      const OPENING_CAPITAL_KEY = 'owo-tea:opening-capital';
      const OPENING_PAYROLL_KEY = 'owo-tea:opening-payroll';
      
      // Helper functions
      const readRoster = () => {
        try {
          const raw = localStorage.getItem(ROSTER_KEY);
          return raw ? JSON.parse(raw) : [];
        } catch {
          return [];
        }
      };
      
      const readDay = (key) => {
        try {
          const raw = localStorage.getItem(PREFIX + key);
          if (!raw) return null;
          return JSON.parse(raw);
        } catch {
          return null;
        }
      };
      
      const readHoliday = (key) => {
        try {
          const raw = localStorage.getItem(HOLIDAY_KEY);
          if (!raw) return false;
          const holidays = JSON.parse(raw);
          return holidays[key] || false;
        } catch {
          return false;
        }
      };
      
      const listStoredDays = () => {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k?.startsWith(PREFIX)) keys.push(k.slice(PREFIX.length));
        }
        return keys.sort().reverse();
      };
      
      // Migrate members
      console.log('🔄 Migrating members...');
      const roster = readRoster();
      console.log(`Found ${roster.length} members in localStorage`);
      
      for (const member of roster) {
        try {
          const { error } = await supabase
            .from('members')
            .upsert({
              id: member.id,
              name: member.name,
              base_salary: member.baseSalary,
              multiplier: member.multiplier,
              bonus: member.bonus || 0,
              active: member.active !== false,
            });
          
          if (error) {
            console.error(`❌ Failed to migrate member ${member.name}:`, error);
          } else {
            console.log(`✅ Migrated member: ${member.name}`);
          }
        } catch (err) {
          console.error(`❌ Error migrating member ${member.name}:`, err);
        }
      }
      
      // Migrate day data
      console.log('🔄 Migrating day data...');
      const dayKeys = listStoredDays();
      console.log(`Found ${dayKeys.length} days in localStorage`);

      for (const key of dayKeys) {
        const dayData = readDay(key);
        if (!dayData) continue;

        const isHoliday = readHoliday(key);

        try {
          const { error } = await supabase
            .from('day_data')
            .upsert({
              date: key,
              cups: dayData.cups || 0,
              price_per_cup: dayData.pricePerCup || 0,
              revenue: dayData.revenue || 0,
              payroll_mode: dayData.payrollMode || 'share',
              salary_share_pct: dayData.salarySharePct || 50,
              capital_mode: dayData.capitalMode || 'detail',
              manual_capital: dayData.manualCapital || 0,
              manual_payroll: dayData.manualPayroll || 0,
              is_holiday: isHoliday || dayData.isHoliday || false,
              materials: dayData.materials || [],
              members: dayData.members || [],
            });

          if (error) {
            console.error(`❌ Failed to migrate day ${key}:`, error);
          } else {
            console.log(`✅ Migrated day: ${key} - Cups: ${dayData.cups}, Revenue: ${dayData.revenue}`);
          }
        } catch (err) {
          console.error(`❌ Error migrating day ${key}:`, err);
        }
      }

      // Log opening capital and payroll (for manual setup later)
      console.log('📊 Opening Capital:', localStorage.getItem(OPENING_CAPITAL_KEY));
      console.log('📊 Opening Payroll:', localStorage.getItem(OPENING_PAYROLL_KEY));
      console.log('ℹ️ Note: Opening capital and payroll need to be set manually in the app or we can add them to Supabase later');

      console.log('🎉 Migrasi selesai!');
      console.log('Cek Supabase Dashboard → Table Editor untuk melihat data yang sudah dimigrasi');
      
    } catch (err) {
      console.error('❌ Migration failed:', err);
    }
  };
  
  script.onerror = () => {
    console.error('❌ Gagal load Supabase client dari CDN');
  };
  
  document.head.appendChild(script);
})();
