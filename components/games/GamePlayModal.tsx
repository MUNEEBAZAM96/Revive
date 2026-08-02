import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { challengeFor } from '@/services/dailyChallengeService';
import type { GameType } from '@/services/dailyChallengeService';
import { GameResult, resolveDifficulty } from '@/services/gameEngine';
import { useGrowthStore } from '@/stores/growthStore';

import BreathingRhythmGame from './BreathingRhythmGame';
import ColorFocusGame from './ColorFocusGame';
import GameResultScreen from './GameResult';
import ImpulseControlGame from './ImpulseControlGame';
import LogicPuzzleGame from './LogicPuzzleGame';
import MemoryGardenGame from './MemoryGardenGame';
import NumberRecallGame from './NumberRecallGame';
import PatternMatchGame from './PatternMatchGame';
import PositiveDecisionsGame from './PositiveDecisionsGame';
import ReactionFocusGame from './ReactionFocusGame';
import WordBuilderGame from './WordBuilderGame';

type GamePlayModalProps = {
  /** The game to play, or null to keep the modal closed. */
  gameType: GameType | null;
  onClose: () => void;
};

/**
 * Hosts whichever game is selected from the daily playlist, then shows the
 * shared GameResult celebration once it's done. One modal for all 10 games —
 * each game component only knows how to play itself and report a GameResult.
 */
export default function GamePlayModal({ gameType, onClose }: GamePlayModalProps) {
  const insets = useSafeAreaInsets();
  const level = useGrowthStore((s) => s.level);
  const completeGame = useGrowthStore((s) => s.completeGame);
  const completeMission = useGrowthStore((s) => s.completeMission);
  const difficulty = resolveDifficulty(level);

  const [summary, setSummary] = useState<ReturnType<typeof completeGame> | null>(null);

  useEffect(() => {
    if (gameType) setSummary(null);
  }, [gameType]);

  if (!gameType) return null;

  const challenge = challengeFor(gameType);

  const handleComplete = (result: GameResult) => {
    setSummary(completeGame(result, difficulty));
    // Playing the Breathing Rhythm game also satisfies the Breathing Session
    // mission — the two represent the same real action.
    if (result.gameType === 'breathing_rhythm') completeMission('breathing_session');
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View
          className="rounded-t-[28px] bg-revive-bg dark:bg-revive-bg-dark"
          style={{ paddingBottom: insets.bottom + 20, maxHeight: '90%' }}>
          <View className="flex-row items-center justify-between px-6 pt-5">
            <Text className="text-[13px] font-semibold uppercase tracking-wider text-revive-primary dark:text-revive-primary-dark">
              {challenge.emoji} {challenge.title}
            </Text>
            <Pressable accessibilityLabel="Close" onPress={onClose} hitSlop={12}>
              <Text className="text-lg text-revive-muted dark:text-revive-muted-dark">✕</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-6 pb-4 pt-4">
            {summary ? (
              <GameResultScreen summary={summary} gameTitle={challenge.title} onContinue={onClose} />
            ) : (
              <Animated.View entering={FadeIn.duration(250)}>
                {gameType === 'word_builder' && (
                  <WordBuilderGame reward={challenge.reward} difficulty={difficulty} onComplete={handleComplete} />
                )}
                {gameType === 'memory_garden' && (
                  <MemoryGardenGame reward={challenge.reward} difficulty={difficulty} onComplete={handleComplete} />
                )}
                {gameType === 'reaction_focus' && (
                  <ReactionFocusGame reward={challenge.reward} difficulty={difficulty} onComplete={handleComplete} />
                )}
                {gameType === 'impulse_control' && (
                  <ImpulseControlGame reward={challenge.reward} difficulty={difficulty} onComplete={handleComplete} />
                )}
                {gameType === 'pattern_match' && (
                  <PatternMatchGame reward={challenge.reward} difficulty={difficulty} onComplete={handleComplete} />
                )}
                {gameType === 'logic_puzzle' && (
                  <LogicPuzzleGame reward={challenge.reward} difficulty={difficulty} onComplete={handleComplete} />
                )}
                {gameType === 'number_recall' && (
                  <NumberRecallGame reward={challenge.reward} difficulty={difficulty} onComplete={handleComplete} />
                )}
                {gameType === 'color_focus' && (
                  <ColorFocusGame reward={challenge.reward} difficulty={difficulty} onComplete={handleComplete} />
                )}
                {gameType === 'positive_decisions' && (
                  <PositiveDecisionsGame reward={challenge.reward} difficulty={difficulty} onComplete={handleComplete} />
                )}
                {gameType === 'breathing_rhythm' && (
                  <BreathingRhythmGame reward={challenge.reward} difficulty={difficulty} onComplete={handleComplete} />
                )}
              </Animated.View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
