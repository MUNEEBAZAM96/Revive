import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import OnboardingScaffold from '@/components/OnboardingScaffold';
import OptionRow from '@/components/onboarding/OptionRow';
import { useAppStore } from '@/stores/appStore';

const AGE_RANGES = ['Under 18', '18–24', '25–34', '35–44', '45+'];

export default function AgeScreen() {
  const router = useRouter();
  const isUnderAge = useAppStore((state) => state.isUnderAge);
  const setIsUnderAge = useAppStore((state) => state.setIsUnderAge);
  const updateProfile = useAppStore((state) => state.updateProfile);
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinue = () => {
    if (!selected) return;
    if (selected === 'Under 18') {
      setIsUnderAge(true);
      return;
    }
    updateProfile({ ageRange: selected });
    router.push('/(onboarding)/focus');
  };

  if (isUnderAge) {
    return (
      <OnboardingScaffold
        step={1}
        ctaLabel="View free support resources"
        ctaVariant="secondary"
        onBack={() => setIsUnderAge(false)}
        onCtaPress={() => router.push('/(modals)/crisis-resources')}>
        <Text className="mt-6 text-center text-5xl">💙</Text>
        <Text className="mt-4 text-center text-[26px] font-bold text-revive-ink dark:text-revive-ink-dark">
          Revive is designed for adults
        </Text>
        <Text className="mt-3 text-center text-base leading-6 text-revive-muted dark:text-revive-muted-dark">
          If you need support, please talk with a trusted adult or professional.
          Free, confidential help for young people is available right now.
        </Text>
      </OnboardingScaffold>
    );
  }

  return (
    <OnboardingScaffold
      step={1}
      ctaLabel="Continue"
      ctaDisabled={!selected}
      onBack={() => router.back()}
      onCtaPress={handleContinue}>
      <Text className="text-[26px] font-bold text-revive-ink dark:text-revive-ink-dark">
        How old are you?
      </Text>
      <Text className="mt-3 text-base leading-6 text-revive-muted dark:text-revive-muted-dark">
        Revive is an adult recovery app. This helps us keep it safe and relevant
        for you.
      </Text>

      <View className="mt-7">
        {AGE_RANGES.map((range) => (
          <OptionRow
            key={range}
            label={range}
            selected={selected === range}
            onPress={() => setSelected(range)}
          />
        ))}
      </View>
    </OnboardingScaffold>
  );
}
