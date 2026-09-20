// Script to migrate opening capital and payroll from localStorage to Supabase
// Run this in browser console to migrate existing data
// Copy and paste this entire script into the browser console

const migrateSettingsToSupabase = async () => {
  try {
    console.log('🔄 Starting migration...');

    // Read from localStorage
    const openingCapital = localStorage.getItem('owo-tea:opening-capital');
    const openingPayroll = localStorage.getItem('owo-tea:opening-payroll');

    console.log('📦 Current localStorage data:');
    console.log('  Opening Capital:', openingCapital);
    console.log('  Opening Payroll:', openingPayroll);

    // Try to access supabase from the running app
    let supabase;
    try {
      // Try importing from the app
      const module = await import('/src/lib/supabase/client');
      supabase = module.supabase;
    } catch (e) {
      console.error('❌ Cannot access supabase client. Are you on the correct page?');
      console.log('💡 Make sure you are on the dashboard page and the app is fully loaded.');
      return;
    }

    if (!supabase) {
      console.error('❌ Supabase client not available');
      return;
    }

    console.log('✅ Supabase client found');

    // Migrate opening capital
    if (openingCapital !== null) {
      console.log('🔄 Migrating opening capital...');
      const { data: existingCapital, error: checkError } = await supabase
        .from('app_settings')
        .select('key')
        .eq('key', 'opening-capital')
        .maybeSingle();

      if (checkError) {
        console.error('❌ Error checking existing capital:', checkError);
        return;
      }

      if (existingCapital) {
        const { error: updateError } = await supabase
          .from('app_settings')
          .update({ value: Number(openingCapital) })
          .eq('key', 'opening-capital');
        if (updateError) {
          console.error('❌ Error updating capital:', updateError);
          return;
        }
        console.log('✅ Updated opening capital in Supabase:', Number(openingCapital));
      } else {
        const { error: insertError } = await supabase
          .from('app_settings')
          .insert({ key: 'opening-capital', value: Number(openingCapital) });
        if (insertError) {
          console.error('❌ Error inserting capital:', insertError);
          return;
        }
        console.log('✅ Inserted opening capital to Supabase:', Number(openingCapital));
      }
    } else {
      console.log('⚠️ No opening capital found in localStorage');
    }

    // Migrate opening payroll
    if (openingPayroll !== null) {
      console.log('🔄 Migrating opening payroll...');
      const { data: existingPayroll, error: checkError } = await supabase
        .from('app_settings')
        .select('key')
        .eq('key', 'opening-payroll')
        .maybeSingle();

      if (checkError) {
        console.error('❌ Error checking existing payroll:', checkError);
        return;
      }

      const payrollValue = JSON.parse(openingPayroll);

      if (existingPayroll) {
        const { error: updateError } = await supabase
          .from('app_settings')
          .update({ value: payrollValue })
          .eq('key', 'opening-payroll');
        if (updateError) {
          console.error('❌ Error updating payroll:', updateError);
          return;
        }
        console.log('✅ Updated opening payroll in Supabase:', payrollValue);
      } else {
        const { error: insertError } = await supabase
          .from('app_settings')
          .insert({ key: 'opening-payroll', value: payrollValue });
        if (insertError) {
          console.error('❌ Error inserting payroll:', insertError);
          return;
        }
        console.log('✅ Inserted opening payroll to Supabase:', payrollValue);
      }
    } else {
      console.log('⚠️ No opening payroll found in localStorage');
    }

    console.log('✅ Migration completed successfully!');
    console.log('💡 You can now refresh the page to see the changes take effect.');
    console.log('💡 The data will now be consistent across all devices.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    if (error.message) {
      console.error('Error details:', error.message);
    }
  }
};

// Run the migration and handle the promise
migrateSettingsToSupabase().then(() => {
  console.log('🎉 Migration function finished');
}).catch((error) => {
  console.error('❌ Migration promise rejected:', error);
});
