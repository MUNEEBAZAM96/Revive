import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import OnboardingScaffold from '@/components/OnboardingScaffold';
import OptionRow from '@/components/onboarding/OptionRow';
import { useAppStore } from '@/stores/appStore';

const GOAL_OPTIONS = [
  'Complete freedom',
  'Better control',
  'More confidence',
  'Better relationships',
  'More time and focus',
  'A healthier lifestyle',
];

export default function GoalScreen() {
  const router = useRouter();
  const updateProfile = useAppStore((state) => state.updateProfile);
  const [selected, setSelected] = useState<string | null>(null);

  const handleNext = () => {
    if (!selected) return;
    updateProfile({ primaryGoal: selected });
    router.push('/(onboarding)/triggers');
  };

  return (
    <OnboardingScaffold
      step={3}
      ctaLabel="Next"
      ctaDisabled={!selected}
      onBack={() => router.back()}
      onCtaPress={handleNext}>
      <Text className="text-[26px] font-bold text-revive-ink dark:text-revive-ink-dark">
        What does success look like for you?
      </Text>
      <Text className="mt-3 text-base leading-6 text-revive-muted dark:text-revive-muted-dark">
        Choose the one that matters most. It will shape your daily journey.
      </Text>

      <View className="mt-7">
        {GOAL_OPTIONS.map((goal) => (
          <OptionRow
            key={goal}
            label={goal}
            selected={selected === goal}
            onPress={() => setSelected(goal)}
          />
        ))}
      </View>
    </OnboardingScaffold>
  );
}
