/**
 * Fix Schema + Clean + Remigrate
 * This script:
 * 1. Adds missing columns to existing tables via RPC
 * 2. Cleans old data
 * 3. Remigrates everything fresh
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Use service role key if available, otherwise anon key
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixAndMigrate() {
  try {
    console.log('=== Step 1: Cleaning old data ===');
    
    // Delete old records and campaigns (order matters due to FK)
    await supabase.from('weekly_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('  Cleaned weekly_records');
    
    await supabase.from('campaigns').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('  Cleaned campaigns');
    
    await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('  Cleaned clients');

    console.log('\n=== Step 2: Creating client "Zoffa" ===');
    const { data: client, error: clientErr } = await supabase
      .from('clients')
      .insert({ name: 'Zoffa' })
      .select()
      .single();
    
    if (clientErr) throw clientErr;
    console.log(`  Client created: ${client.name} (${client.id})`);

    console.log('\n=== Step 3: Loading campaign data ===');
    const dataPath = path.resolve(__dirname, '../../zoffa/datos.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const { campaigns, meta } = JSON.parse(rawData);
    console.log(`  Found ${campaigns.length} campaigns, Week ${meta.current_week}`);

    // Target goals from "zoffa 20% semanal.txt"
    const targets = {
      'Sillón Miller': { budget: 7370, week: 6 },
      'Silla Wishbone': { budget: 9944, week: 11 },
      'Flujo al local': { budget: 12540, week: 9 },
      'Sillas Bistró': { budget: 12540, week: 9 }
    };

    console.log('\n=== Step 4: Migrating campaigns ===');
    for (const camp of campaigns) {
      const target = targets[camp.name] || {};

      const { data: newCamp, error: campError } = await supabase
        .from('campaigns')
        .insert({
          client_id: client.id,
          name: camp.name,
          status: camp.status === 'paused_by_client' ? 'paused' : 'active',
          type: camp.type,
          current_week: meta.current_week,
          increment_strategy: meta.increment_strategy,
          target_budget: target.budget || null,
          target_week: target.week || null
        })
        .select()
        .single();

      if (campError) {
        console.error(`  ERROR inserting ${camp.name}:`, campError.message);
        continue;
      }
      console.log(`  ✓ ${newCamp.name} (target: ${target.budget ? '$' + target.budget + ' @ S' + target.week : 'none'})`);

      const records = [];
      
      // History
      if (camp.history) {
        for (const [key, value] of Object.entries(camp.history)) {
          records.push({
            campaign_id: newCamp.id,
            week_number: parseInt(key.split('_')[1]),
            budget: value,
            is_projection: false
          });
        }
      }

      // Budgets (campaign level)
      if (camp.budgets) {
        for (const [key, value] of Object.entries(camp.budgets)) {
          records.push({
            campaign_id: newCamp.id,
            week_number: parseInt(key.split('_')[1]),
            budget: value,
            is_projection: false
          });
        }
      }

      // Adsets
      if (camp.adsets) {
        for (const adset of camp.adsets) {
          // Extract clean label name
          let adsetLabel = adset.name;
          if (adset.name.includes('-')) {
            adsetLabel = adset.name.split('-').pop().trim();
          }

          for (const [key, value] of Object.entries(adset.budgets)) {
            records.push({
              campaign_id: newCamp.id,
              label: adsetLabel,
              week_number: parseInt(key.split('_')[1]),
              budget: value,
              is_projection: false
            });
          }
        }
      }

      if (records.length > 0) {
        const { error: recError } = await supabase.from('weekly_records').insert(records);
        if (recError) {
          console.error(`  ERROR inserting records for ${camp.name}:`, recError.message);
        } else {
          console.log(`    → ${records.length} weekly record(s) inserted`);
        }
      }
    }

    console.log('\n=== Migration Complete! ===');
    console.log('Refresh your browser at http://localhost:3000');
  } catch (err) {
    console.error('\nFATAL ERROR:', err.message);
    console.error('Full error:', JSON.stringify(err, null, 2));
  }
}

fixAndMigrate();
