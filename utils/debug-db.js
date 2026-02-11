
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debug() {
  console.log('=== DEBUGGING DB ===');
  
  // 1. Get Campaigns
  const { data: campaigns, error: cErr } = await supabase.from('campaigns').select('*');
  if (cErr) console.error('Error fetching campaigns:', cErr);
  
  // 2. Get Records
  const { data: records, error: rErr } = await supabase.from('weekly_records').select('*');
  if (rErr) console.error('Error fetching records:', rErr);

  console.log(`Found ${campaigns.length} campaigns and ${records.length} records.\n`);

  for (const camp of campaigns) {
    console.log(`CAMPAIGN: "${camp.name}" (ID: ${camp.id})`);
    console.log(`  Type: ${camp.type}, Status: ${camp.status}`);
    
    // Find records for this campaign
    const campRecs = records.filter(r => r.campaign_id === camp.id).sort((a,b) => a.week_number - b.week_number);
    
    if (campRecs.length === 0) {
      console.log('  ⚠️ NO RECORDS FOUND');
    } else {
      campRecs.forEach(r => {
        console.log(`  - Week ${r.week_number}: $${r.budget} [Label: "${r.label || 'NULL'}"]`);
      });
    }
    console.log('');
  }
}

debug();
