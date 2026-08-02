import { useEffect, useMemo } from 'react';

import GameList from '@/components/games/GameList';
import { challengeFor, GameType, totalMinutes } from '@/services/dailyChallengeService';
import { resolveDifficulty } from '@/services/gameEngine';
import { useGrowthStore } from '@/stores/growthStore';

type DailyPlaylistSectionProps = {
  onSelectGame: (gameType: GameType) => void;
  delay?: number;
};

/**
 * Wraps GameList with the reactive playlist from the growth store. Reads the
 * raw `todaysPlaylist` state (not the `getTodaysGames()` helper method) and
 * derives the challenge-joined list locally — calling a store method that
 * builds a new array inside a selector would give Zustand a new reference
 * every render and risk a re-render loop.
 */
export default function DailyPlaylistSection({ onSelectGame, delay = 0 }: DailyPlaylistSectionProps) {
  const level = useGrowthStore((s) => s.level);
  const playlist = useGrowthStore((s) => s.todaysPlaylist);
  const loadPlaylist = useGrowthStore((s) => s.loadPlaylist);

  useEffect(() => {
    loadPlaylist();
  }, [loadPlaylist]);

  const difficulty = resolveDifficulty(level);

  const games = useMemo(
    () =>
      playlist.games.map((g) => ({
        challenge: challengeFor(g.gameType),
        completed: g.completed,
      })),
    [playlist],
  );

  const minutes = useMemo(() => totalMinutes(games.map((g) => g.challenge)), [games]);

  if (games.length === 0) return null;

  return (
    <GameList
      games={games}
      totalMinutes={minutes}
      difficulty={difficulty}
      onSelect={onSelectGame}
      delay={delay}
    />
  );
}
