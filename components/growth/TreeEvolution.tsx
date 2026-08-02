import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { stageForLevel } from '@/services/growthLevels';

type TreeEvolutionProps = {
  level: number;
  /** Visual size of the tree circle. */
  size?: number;
  /** Equipped Garden Theme's halo tint — falls back to the default sage mist. */
  haloColor?: string;
};

/**
 * The user's growth made visible. The tree evolves with their recovery level
 * (seed → sprout → young tree → strong tree → forest) and floats gently —
 * alive, never static. Leaves fade in around stronger stages.
 */
export default function TreeEvolution({ level, size = 112, haloColor }: TreeEvolutionProps) {
  const stage = stageForLevel(level);
  const float = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 2600, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 2600, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
  }, [float]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value }],
  }));

  const isForest = stage.id === 'stage_6_forest';
  const showLeaves = stage.fromLevel >= 12;

  return (
    <View
      className={haloColor ? 'items-center justify-center rounded-full' : 'items-center justify-center rounded-full bg-revive-mist dark:bg-revive-mist-dark'}
      style={haloColor ? { width: size, height: size, backgroundColor: haloColor } : { width: size, height: size }}>
      <Animated.View style={floatStyle}>
        {isForest ? (
          <Text style={{ fontSize: size * 0.32 }}>🌳🌲🌳</Text>
        ) : (
          <Text style={{ fontSize: size * 0.5 }}>{stage.emoji}</Text>
        )}
      </Animated.View>

      {/* Leaves appear as the tree matures. keyed by stage so they re-enter on evolution. */}
      {showLeaves && (
        <Animated.View
          key={stage.id}
          entering={FadeIn.duration(800)}
          pointerEvents="none"
          style={{ position: 'absolute', top: 6, right: 10 }}>
          <Text style={{ fontSize: size * 0.16 }}>🍃</Text>
        </Animated.View>
      )}
    </View>
  );
}
