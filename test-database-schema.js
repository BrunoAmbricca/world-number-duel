const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wlzsgdriumiliuhgktjm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsenNnZHJpdW1pbGl1aGdrdGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NDQ4NzIsImV4cCI6MjA3MTIyMDg3Mn0.seVoKi9Q1y1KhcdFMpnDg8WadoJ3xJilduyNs9pSxmk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseSchema() {
  console.log('🔍 Testing database schema...');

  try {
    // Try to query match_rounds table to see what columns exist
    const { data, error } = await supabase
      .from('match_rounds')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Error querying match_rounds:', error.message);
      
      // Check if it's a column name issue
      if (error.message.includes('correct_sum') || error.message.includes('target_sum')) {
        console.log('🔧 Detected column name issue. The database schema needs to be updated.');
        console.log('\n📋 Please run this SQL in your Supabase SQL Editor:');
        console.log('='.repeat(60));
        console.log(`
-- Check current schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'match_rounds' 
ORDER BY ordinal_position;

-- Update schema if needed
ALTER TABLE match_rounds 
  RENAME COLUMN target_sum TO correct_sum;

-- Change player answers to INTEGER if they're still JSONB
ALTER TABLE match_rounds 
  ALTER COLUMN player1_answer TYPE INTEGER USING (
    CASE 
      WHEN player1_answer IS NULL THEN NULL 
      WHEN jsonb_typeof(player1_answer) = 'number' THEN (player1_answer)::integer
      ELSE (player1_answer->>0)::integer 
    END
  ),
  ALTER COLUMN player2_answer TYPE INTEGER USING (
    CASE 
      WHEN player2_answer IS NULL THEN NULL 
      WHEN jsonb_typeof(player2_answer) = 'number' THEN (player2_answer)::integer
      ELSE (player2_answer->>0)::integer 
    END
  );

SELECT 'Schema update completed!' as result;
        `);
        console.log('='.repeat(60));
      }
      return false;
    }

    if (data && data.length > 0) {
      console.log('✅ Found existing match_rounds data:', data[0]);
      
      // Check if the data has the correct structure
      const round = data[0];
      const hasCorrectSum = 'correct_sum' in round;
      const hasTargetSum = 'target_sum' in round;
      
      console.log('📊 Schema check:');
      console.log(`   - Has correct_sum: ${hasCorrectSum}`);
      console.log(`   - Has target_sum: ${hasTargetSum}`);
      console.log(`   - player1_answer type: ${typeof round.player1_answer}`);
      console.log(`   - player2_answer type: ${typeof round.player2_answer}`);
      
      if (hasTargetSum && !hasCorrectSum) {
        console.log('🔧 Schema update needed: target_sum should be renamed to correct_sum');
      } else if (hasCorrectSum) {
        console.log('✅ Schema looks correct');
      }
    } else {
      console.log('ℹ️  No existing match_rounds data, testing with empty table...');
      
      // Test inserting a round to see the schema
      console.log('🧪 Testing schema with a dummy insert...');
      
      const testData = {
        match_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        round_number: 1,
        sequence: [1, -2, 3],
        correct_sum: 2
      };
      
      const { error: insertError } = await supabase
        .from('match_rounds')
        .insert(testData);
        
      if (insertError) {
        console.log('❌ Insert test failed:', insertError.message);
        if (insertError.message.includes('correct_sum')) {
          console.log('🔧 Column correct_sum does not exist. Schema update needed.');
        }
      } else {
        console.log('✅ Insert test passed - schema looks correct');
        
        // Clean up test data
        await supabase
          .from('match_rounds')
          .delete()
          .eq('match_id', testData.match_id);
        console.log('🧹 Cleaned up test data');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

testDatabaseSchema();