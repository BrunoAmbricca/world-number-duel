export interface User {
  id: string;
  username: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  player1_id: string;
  player2_id: string;
  status: 'waiting' | 'active' | 'completed' | 'abandoned';
  winner_id?: string;
  created_at: string;
  updated_at: string;
  current_round: number;
  current_turn?: string;
  player1?: User;
  player2?: User;
}

export interface MatchRound {
  id: string;
  match_id: string;
  round_number: number;
  sequence: number[];
  correct_sum: number;
  player1_answer?: number;
  player2_answer?: number;
  player1_correct?: boolean;
  player2_correct?: boolean;
  player1_submitted_at?: string;
  player2_submitted_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface MatchmakingQueue {
  id: string;
  player_id: string;
  joined_at: string;
}

export interface MatchState {
  match: Match;
  currentRound?: MatchRound;
  rounds: MatchRound[];
}

export interface PusherEvents {
  'round-completed': {
    round: MatchRound;
    match: Match;
    nextRoundNeeded: boolean;
  };
  'answer-submitted': {
    playerId: string;
    isCorrect: boolean;
    waitingForOpponent: boolean;
  };
  'match-found': {
    matchId: string;
    opponentId: string;
  };
}