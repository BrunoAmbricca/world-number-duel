import MultiplayerNumberSequenceGame from '@/components/MultiplayerNumberSequenceGame';

interface GamePageProps {
  params: Promise<{
    matchId: string;
  }>;
}

export default async function GamePage({ params }: GamePageProps) {
  const { matchId } = await params;
  return <MultiplayerNumberSequenceGame matchId={matchId} />;
}