# Matchmaking System Upgrade Guide

This guide explains how to deploy the improved matchmaking system that prevents race conditions and ensures atomic operations.

## ⚠️ Important: Database Changes Required

The new system requires database schema updates. **Please backup your database before proceeding.**

## 🗄️ Database Migration

### Step 1: Run the Schema Update

Execute the following SQL in your Supabase SQL Editor:

```sql
-- Run this file in your Supabase SQL Editor
```

Then upload and execute the `atomic-matchmaking-schema.sql` file:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `atomic-matchmaking-schema.sql`
4. Execute the SQL

### Step 2: Verify Database Changes

After running the migration, verify the changes:

```sql
-- Check that the status column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'matchmaking_queue';

-- Check that the function was created
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'atomic_matchmaking';
```

## 🚀 Deployment Steps

### 1. Update Your Environment

Ensure your application has the latest code changes:

- `src/app/api/matchmaking/join/route.ts` - Updated with atomic operations
- `src/app/api/matchmaking/leave/route.ts` - Enhanced queue management
- `src/hooks/useMatchmaking.ts` - Improved client-side logic

### 2. Test the System

Before going live, run the test script:

```bash
# Make the test script executable
chmod +x test-concurrent-matchmaking.js

# Test with local development server
npm run dev &
node test-concurrent-matchmaking.js --base-url=http://localhost:3000

# Test with production URL (replace with your actual URL)
node test-concurrent-matchmaking.js --base-url=https://your-app.vercel.app
```

### 3. Deploy to Production

Deploy your application as usual (e.g., `git push` for Vercel deployment).

## 🔧 What's New

### Key Improvements

1. **Single-Player-Per-Match Enforcement**: Players can only have one active match at a time
2. **Atomic Matchmaking**: Uses database transactions to prevent race conditions
3. **Unique Queue Constraints**: Database-level prevention of duplicate queue entries
4. **Active Match Detection**: Returns existing match if player already has one active
5. **Enhanced Error Handling**: Better recovery from edge cases
6. **Improved Client Logic**: More robust polling and state management
7. **Match Lifecycle Management**: Proper match finishing with status updates

### Database Functions

#### `atomic_matchmaking(player_id TEXT)`
The core matchmaking function that:
- Checks for existing active matches first
- Locks both matchmaking queue and matches tables during operations
- Atomically matches players or adds them to the queue
- Prevents race conditions through exclusive table locking
- Returns existing active match if player already has one
- Uses `INSERT ... ON CONFLICT` for queue safety

#### `finish_match(match_uuid UUID, winner_player_id TEXT)`
Safely finishes matches:
- Updates match status from 'active' to 'finished'
- Sets winner if provided
- Prevents finishing non-existent or already finished matches

#### `get_player_active_match(player_uuid TEXT)`
Helper function to find a player's current active match

### API Changes

#### Join Queue Response Format

**New Response (Already Active Match):**
```json
{
  "matched": true,
  "matchId": "uuid",
  "opponentId": "player-id", 
  "message": "Already in active match"
}
```

**New Response (New Match Created):**
```json
{
  "matched": true,
  "matchId": "uuid",
  "opponentId": "player-id"
}
```

**Queue Response (No Change):**
```json
{
  "matched": false,
  "queueId": "uuid", 
  "message": "Waiting for opponent"
}
```

#### New API Endpoint: Finish Match

**POST** `/api/matchmaking/finish`

**Request:**
```json
{
  "matchId": "uuid",
  "winnerId": "player-id" // optional
}
```

**Response:**
```json
{
  "message": "Match finished successfully",
  "matchId": "uuid",
  "winnerId": "player-id"
}
```

#### Leave Queue Response Format

**Enhanced Response:**
```json
{
  "message": "Left matchmaking queue",
  "removed": true
}
```

## 🧪 Testing Scenarios

The enhanced test script now includes three comprehensive tests:

### 1. Single-Player-Per-Match Test

Verifies that:
- ✅ Players with active matches cannot join queue again
- ✅ Duplicate join requests return the existing active match
- ✅ Players can join queue again after match is finished
- ✅ Match finishing works correctly

### 2. Sequential Matchmaking Test

Basic functionality test:
- ✅ First player enters queue
- ✅ Second player gets matched immediately
- ✅ Both players receive correct match details

### 3. Concurrent Player Test

The test script simulates 10 players joining simultaneously and verifies:
- ✅ No duplicate match assignments
- ✅ Exactly 2 players per match
- ✅ Correct opponent mapping
- ✅ Atomic queue operations
- ✅ Automatic cleanup of test matches

### Expected Results

For 10 concurrent players:
- 5 matches created (10 players ÷ 2)
- 0 players left in queue
- All matches have exactly 2 players
- No race conditions
- All test matches are properly cleaned up

## 🔍 Monitoring

### Database Queries for Monitoring

```sql
-- Check current queue status
SELECT player_id, status, joined_at 
FROM matchmaking_queue 
ORDER BY joined_at;

-- Check recent matches
SELECT id, player1_id, player2_id, status, created_at 
FROM matches 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Clean up stale queue entries (run periodically)
SELECT cleanup_stale_queue_entries();
```

### Application Logs to Monitor

Look for these log patterns:

- `🔄 Matchmaking join request received`
- `🎯 Match found event received!`
- `📡 Notified player X about match Y`
- `❌ Transaction error:` (should be rare)

## 🚨 Rollback Plan

If issues occur, you can rollback by:

1. **Revert Code Changes**: Deploy the previous version
2. **Database Rollback** (if needed):
   ```sql
   -- Remove the status column (optional)
   ALTER TABLE matchmaking_queue DROP COLUMN IF EXISTS status;
   
   -- Drop the new function
   DROP FUNCTION IF EXISTS atomic_matchmaking(TEXT);
   DROP FUNCTION IF EXISTS cleanup_stale_queue_entries();
   ```

## 📊 Performance Considerations

### Database Performance

- The new system uses exclusive table locks during matchmaking
- This ensures consistency but may slightly increase latency
- For high-traffic scenarios, consider implementing a queue-based system

### Scalability

The current implementation scales well for moderate traffic (hundreds of concurrent users). For larger scale:

1. Consider implementing a Redis-based queue system
2. Use database connection pooling
3. Implement horizontal database scaling

## ✅ Success Criteria

Your deployment is successful when:

1. ✅ Test script passes all scenarios
2. ✅ No duplicate matches in production logs
3. ✅ Players are consistently matched in pairs
4. ✅ No "stuck" players in queue
5. ✅ Pusher notifications work correctly

## 🆘 Troubleshooting

### Common Issues

**Issue**: `function atomic_matchmaking(text) does not exist`
**Solution**: Ensure you've run the database migration SQL

**Issue**: Players getting stuck in queue
**Solution**: Run the cleanup function: `SELECT cleanup_stale_queue_entries();`

**Issue**: Test script fails with connection errors
**Solution**: Ensure your development server is running and accessible

### Getting Help

If you encounter issues:

1. Check the application logs for error messages
2. Verify database schema with the SQL queries above
3. Run the test script to identify specific problems
4. Check that all environment variables are set correctly

---

**Next Steps**: After deployment, monitor the system for 24-48 hours to ensure stability, then consider implementing additional features like queue position indicators or estimated wait times.