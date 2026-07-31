import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { cardShadow } from './theme';

const MOODS = [
  { emoji: '😔', label: 'Heavy' },
  { emoji: '😐', label: 'Normal' },
  { emoji: '🙂', label: 'Positive' },
  { emoji: '🔥', label: 'Struggling' },
] as const;

const EXPERIENCES = ['Stress', 'Loneliness', 'Boredom', 'Strong urges', 'Low motivation'];

type MoodCheckCardProps = {
  onMoodChange?: (mood: string | null) => void;
  delay?: number;
};

function MoodOption({
  emoji,
  label,
  selected,
  onPress,
}: {
  emoji: string;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(selected ? 1.12 : 1, { damping: 12, stiffness: 180 });
  }, [selected, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className="items-center">
      <Animated.View style={animatedStyle}>
        <View
          className={`h-16 w-16 items-center justify-center rounded-full ${
            selected
              ? 'bg-revive-secondary/60 dark:bg-revive-primary-dark/30'
              : 'bg-revive-mist dark:bg-revive-mist-dark'
          }`}>
          <Text className="text-3xl">{emoji}</Text>
        </View>
      </Animated.View>
      <Text
        className={`mt-2 text-[13px] ${
          selected
            ? 'font-semibold text-revive-primary dark:text-revive-primary-dark'
            : 'text-revive-muted dark:text-revive-muted-dark'
        }`}>
        {label}
      </Text>
    </Pressable>
  );
}

/** A gentle check-in, not a survey. Nothing is required, nothing is judged. */
export default function MoodCheckCard({ onMoodChange, delay = 0 }: MoodCheckCardProps) {
  const [mood, setMood] = useState<string | null>(null);
  const [experiences, setExperiences] = useState<string[]>([]);

  const selectMood = (label: string) => {
    const nextMood = mood === label ? null : label;
    setMood(nextMood);
    onMoodChange?.(nextMood);
  };

  const toggleExperience = (item: string) => {
    setExperiences((current) =>
      current.includes(item) ? current.filter((entry) => entry !== item) : [...current, item],
    );
  };

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(550)} style={cardShadow}>
      <View className="rounded-[28px] bg-revive-card p-6 dark:bg-revive-card-dark">
        <Text className="text-xl font-semibold text-revive-ink dark:text-revive-ink-dark">
          How are you feeling today?
        </Text>

        <View className="mt-5 flex-row justify-between">
          {MOODS.map((option) => (
            <MoodOption
              key={option.label}
              emoji={option.emoji}
              label={option.label}
              selected={mood === option.label}
              onPress={() => selectMood(option.label)}
            />
          ))}
        </View>

        {mood !== null && (
          <Animated.View entering={FadeIn.duration(350)}>
            <Text className="mt-6 text-base font-medium text-revive-ink dark:text-revive-ink-dark">
              What are you experiencing?
            </Text>
            <View className="mt-3 flex-row flex-wrap gap-2">
              {EXPERIENCES.map((item) => {
                const selected = experiences.includes(item);
                return (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => toggleExperience(item)}
                    className={`rounded-full px-4 py-2 ${
                      selected
                        ? 'bg-revive-primary dark:bg-revive-primary-dark'
                        : 'bg-revive-mist dark:bg-revive-mist-dark'
                    }`}>
                    <Text
                      className={`text-sm ${
                        selected
                          ? 'font-semibold text-white dark:text-revive-bg-dark'
                          : 'text-revive-ink dark:text-revive-ink-dark'
                      }`}>
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text className="mt-4 text-[13px] text-revive-muted dark:text-revive-muted-dark">
              Thank you for checking in. Naming what you feel is already progress.
            </Text>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
}
