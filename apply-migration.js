require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    // Read the SQL migration file
    const sql = fs.readFileSync('./add-single-player-high-scores.sql', 'utf8');
    
    // Split SQL commands and execute them one by one
    const commands = sql.split(';').filter(cmd => cmd.trim().length > 0);
    
    console.log(`Executing ${commands.length} SQL commands...`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i].trim();
      if (command.length === 0) continue;
      
      console.log(`Executing command ${i + 1}...`);
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql: command + ';' 
      });
      
      if (error) {
        console.error(`Error in command ${i + 1}:`, error);
        return;
      }
    }
    
    console.log('Migration applied successfully!');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

applyMigration();