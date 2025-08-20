import MultiplayerGamePage from '@/components/MultiplayerGamePage';

interface GamePageProps {
  params: Promise<{
    matchId: string;
  }>;
}

export default async function GamePage({ params }: GamePageProps) {
  const { matchId } = await params;
  return <MultiplayerGamePage matchId={matchId} />;
}