const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixHistory() {
  try {
    console.log('=== Recalculating History based on Brief (FINAL FIX) ===');

    // 1. Get Campaigns
    const { data: campaigns } = await supabase.from('campaigns').select('id, name, type');
    const campMap = {};
    campaigns.forEach(c => campMap[c.name] = c);

    // 2. Clear ALL weekly_records to avoid duplicates/conflicts
    // This is drastic but ensures we don't have "Label: NULL" AND "Label: X" conflicts for the same thing
    console.log('Cleaning all weekly records...');
    await supabase.from('weekly_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 3. Define Base Data (Week 1)
    // Week 1 = Base
    // Week 2 = Base * 1.2
    // Week 3 = Base * 1.2 * 1.2

    const strategies = [
      { name: 'Jula', base: 1500, active_weeks: [1] },
      
      { name: 'Flujo al local', base: 2300, active_weeks: [1, 2, 3] },
      
      // Sillas Bistró is an Adset Budget campaign, so it needs a label matching the Adset Name
      // In datos.json it was "Conjunto Mensajes - Sillas Bistró" -> "Sillas Bistró"
      { name: 'Sillas Bistró', label: 'Sillas Bistró', base: 2300, active_weeks: [1, 2, 3] },

      { name: 'Sillón Miller', base: 2300, active_weeks: [1, 2, 3] },

      // Wishbone (Mixed) - Split
      { name: 'Silla Wishbone', label: 'Wishbone - Pinamar', base: 1300, active_weeks: [1, 2, 3] },
      { name: 'Silla Wishbone', label: 'Wishbone - General', base: 1000, active_weeks: [1, 2, 3] },
    ];

    const recordsToInsert = [];

    for (const strat of strategies) {
      const camp = campMap[strat.name];
      if (!camp) {
        console.warn(`Skipping ${strat.name} (not found in DB)`);
        continue;
      }

      let currentBudget = strat.base;

      for (let week = 1; week <= 3; week++) {
        let budget = currentBudget;
        
        // Handling inactive weeks
        if (!strat.active_weeks.includes(week)) {
          budget = 0;
        }

        recordsToInsert.push({
          campaign_id: camp.id,
          week_number: week,
          label: strat.label || null, // Important: Explicitly null if no label
          budget: Math.round(budget),
          is_projection: false
        });

        if (strat.active_weeks.includes(week)) {
           currentBudget = currentBudget * 1.2;
        }
      }
    }

    // 4. Batch Insert
    if (recordsToInsert.length > 0) {
      const { error } = await supabase.from('weekly_records').insert(recordsToInsert);
      if (error) {
        throw error;
      }
      console.log(`Successfully inserted ${recordsToInsert.length} records.`);
    }

    console.log('=== History & Data Cleaned ===');

  } catch (err) {
    console.error('Error:', err);
  }
}

fixHistory();
