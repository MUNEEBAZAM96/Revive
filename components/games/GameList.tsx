import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import type { GameType, MindChallenge } from '@/services/dailyChallengeService';
import type { Difficulty } from '@/services/gameEngine';

import GameCard from './GameCard';

type PlaylistEntry = { challenge: MindChallenge; completed: boolean };

type GameListProps = {
  games: PlaylistEntry[];
  totalMinutes: number;
  difficulty: Difficulty;
  onSelect: (gameType: GameType) => void;
  delay?: number;
};

/** Today's 5-game playlist — "Today's Training · N Challenges · X minutes". */
export default function GameList({ games, totalMinutes, difficulty, onSelect, delay = 0 }: GameListProps) {
  return (
    <View>
      <Animated.View entering={FadeInDown.delay(delay).duration(450)} className="mb-4">
        <Text className="text-xl font-semibold text-revive-ink dark:text-revive-ink-dark">
          Today&apos;s Training
        </Text>
        <Text className="mt-1 text-sm text-revive-muted dark:text-revive-muted-dark">
          {games.length} Challenges · Estimated Time {totalMinutes} minutes
        </Text>
      </Animated.View>

      {games.map((entry, index) => (
        <GameCard
          key={entry.challenge.gameType}
          challenge={entry.challenge}
          completed={entry.completed}
          difficulty={difficulty}
          onPress={() => onSelect(entry.challenge.gameType)}
          delay={delay + 80 + index * 60}
        />
      ))}
    </View>
  );
}
