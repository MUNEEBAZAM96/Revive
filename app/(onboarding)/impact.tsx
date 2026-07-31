import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import OnboardingScaffold from '@/components/OnboardingScaffold';
import OptionRow from '@/components/onboarding/OptionRow';
import { useAppStore } from '@/stores/appStore';

const IMPACT_OPTIONS = [
  'My confidence',
  'My motivation',
  'My productivity',
  'My relationships',
  'My mental peace',
  'My self-control',
];

export default function ImpactScreen() {
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
    updateProfile({ lifeImpact: selected });
    router.push('/(onboarding)/support');
  };

  return (
    <OnboardingScaffold
      step={5}
      ctaLabel="Next"
      ctaDisabled={selected.length === 0}
      onBack={() => router.back()}
      onCtaPress={handleNext}>
      <Text className="text-[26px] font-bold text-revive-ink dark:text-revive-ink-dark">
        How has this affected your life?
      </Text>
      <Text className="mt-3 text-base leading-6 text-revive-muted dark:text-revive-muted-dark">
        Naming it is the first step to changing it. Pick all that apply.
      </Text>

      <View className="mt-7">
        {IMPACT_OPTIONS.map((label) => (
          <OptionRow
            key={label}
            label={label}
            selected={selected.includes(label)}
            onPress={() => toggle(label)}
          />
        ))}
      </View>
    </OnboardingScaffold>
  );
}
