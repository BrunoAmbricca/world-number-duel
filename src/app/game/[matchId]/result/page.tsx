'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Match } from '@/types/multiplayer';
import MatchResult from '@/components/MatchResult';

export default function MatchResultPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = params.matchId as string;

  const [match, setMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMatchResult = async () => {
      try {
        setIsLoading(true);
        const result = await api.getMatch(matchId);
        
        if (result.error) {
          setError(result.error);
          return;
        }

        // Ensure the match is completed
        if (result.match.status !== 'completed') {
          setError('Match is not completed yet');
          return;
        }

        setMatch(result.match);
      } catch (err) {
        setError('Failed to load match result');
      } finally {
        setIsLoading(false);
      }
    };

    if (matchId) {
      loadMatchResult();
    }
  }, [matchId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading match result...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No match data found</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return <MatchResult match={match} />;
}