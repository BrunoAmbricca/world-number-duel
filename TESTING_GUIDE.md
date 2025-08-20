# Single-Player High Score Testing Guide

## How to Test the Complete Flow

1. **Start the Game**
   - Open http://localhost:3000 in your browser
   - Click "Single Player" button
   - A session will be created and you'll be taken to `/game`

2. **Play Multiple Rounds**
   - Click "Start Game"
   - Watch the sequence of numbers appear (e.g., +3, -1, +7, -2, +4)
   - Calculate the sum (e.g., 3 - 1 + 7 - 2 + 4 = 11)
   - Enter your answer and submit
   - If correct, you'll see "Correct! Round X Complete!"
   - Click "Next Round" to continue
   - Keep playing until you make a mistake

3. **Game Over Experience**
   - When you enter a wrong answer, you'll see:
     - "Game Over!" screen
     - "You reached Round X" (your final score)
     - Your personal best score
     - If you beat your previous record: "🎉 New Personal Best! 🎉"
   - Options to "Play Again" or "Back to Main Menu"

4. **Test High Score Persistence**
   - Play a game and reach round 5
   - Go back to main menu and start a new game
   - Your best score should be displayed in the top right
   - Try to beat your record

## Expected Features

- ✅ Continuous rounds until failure
- ✅ Score tracking (rounds completed)
- ✅ High score persistence per player
- ✅ Game Over screen with stats
- ✅ New record celebration
- ✅ Navigation back to main menu

## API Testing (Optional)

Test the high score API directly:

```bash
# Get high score for a player
curl "http://localhost:3000/api/high-score?playerId=player123"

# Save a high score
curl -X POST "http://localhost:3000/api/high-score" \
  -H "Content-Type: application/json" \
  -d '{"playerId":"player123","score":8}'
```

## Note on Database

The application currently handles the case where the `single_player_scores` table doesn't exist by gracefully falling back to in-memory behavior. To enable full persistence, you would need to apply the database migration in `add-single-player-high-scores.sql` to your Supabase instance.