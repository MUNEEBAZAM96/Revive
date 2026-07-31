import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, Text, View } from 'react-native';

import { useReviveColors } from '@/components/dashboard/theme';

type OptionRowProps = {
  label: string;
  emoji?: string;
  selected: boolean;
  onPress: () => void;
};

/**
 * A full-width selectable card used across the onboarding questions. Works for
 * both single- and multi-select — the parent owns the selection logic.
 */
export default function OptionRow({ label, emoji, selected, onPress }: OptionRowProps) {
  const colors = useReviveColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`mb-3 flex-row items-center rounded-2xl border px-4 py-4 active:opacity-90 ${
        selected
          ? 'border-revive-primary bg-revive-secondary/25 dark:border-revive-primary-dark dark:bg-revive-primary-dark/15'
          : 'border-revive-mist bg-revive-card dark:border-revive-mist-dark dark:bg-revive-card-dark'
      }`}>
      {emoji ? <Text className="mr-3 text-xl">{emoji}</Text> : null}
      <Text
        className={`flex-1 text-base text-revive-ink dark:text-revive-ink-dark ${
          selected ? 'font-semibold' : ''
        }`}>
        {label}
      </Text>
      <View
        className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
          selected
            ? 'border-revive-primary bg-revive-primary dark:border-revive-primary-dark dark:bg-revive-primary-dark'
            : 'border-revive-muted/40'
        }`}>
        {selected ? <FontAwesome name="check" size={12} color={colors.card} /> : null}
      </View>
    </Pressable>
  );
}
