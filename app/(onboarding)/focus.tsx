import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import OnboardingScaffold from '@/components/OnboardingScaffold';
import OptionRow from '@/components/onboarding/OptionRow';
import { useAppStore } from '@/stores/appStore';

const FOCUS_OPTIONS = [
  { emoji: '🌱', label: 'Reduce porn use' },
  { emoji: '🎯', label: 'Quit porn completely' },
  { emoji: '🔁', label: 'Control compulsive habits' },
  { emoji: '🧠', label: 'Improve focus and productivity' },
  { emoji: '💪', label: 'Improve confidence' },
  { emoji: '❤️', label: 'Improve relationships' },
  { emoji: '🧭', label: 'Build discipline' },
];

export default function FocusScreen() {
  const router = useRouter();
  const updateProfile = useAppStore((state) => state.updateProfile);
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (label: string) => {
    setSelected((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label],
    );
  };

  const handleNext = () => {
    updateProfile({ focusAreas: selected });
    router.push('/(onboarding)/goal');
  };

  return (
    <OnboardingScaffold
      step={2}
      ctaLabel="Next"
      ctaDisabled={selected.length === 0}
      onBack={() => router.back()}
      onCtaPress={handleNext}>
      <Text className="text-[26px] font-bold text-revive-ink dark:text-revive-ink-dark">
        What would you like to improve?
      </Text>
      <Text className="mt-3 text-base leading-6 text-revive-muted dark:text-revive-muted-dark">
        Pick everything that fits. There are no wrong answers here.
      </Text>

      <View className="mt-7">
        {FOCUS_OPTIONS.map((option) => (
          <OptionRow
            key={option.label}
            emoji={option.emoji}
            label={option.label}
            selected={selected.includes(option.label)}
            onPress={() => toggle(option.label)}
          />
        ))}
      </View>
    </OnboardingScaffold>
  );
}
