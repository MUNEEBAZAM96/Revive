import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import OnboardingScaffold from '@/components/OnboardingScaffold';
import OptionRow from '@/components/onboarding/OptionRow';
import { useAppStore } from '@/stores/appStore';

const SUPPORT_STYLES = [
  'Daily motivation',
  'Understanding my triggers',
  'Practical exercises',
  'Tracking progress',
  'Someone to talk to',
];

const DAILY_TIMES = ['2 minutes', '5 minutes', '10 minutes', '15+ minutes'];

export default function SupportScreen() {
  const router = useRouter();
  const updateProfile = useAppStore((state) => state.updateProfile);
  const [supportStyle, setSupportStyle] = useState<string | null>(null);
  const [dailyTime, setDailyTime] = useState<string | null>(null);

  const handleNext = () => {
    if (!supportStyle || !dailyTime) return;
    updateProfile({ supportPreference: supportStyle, dailyCommitment: dailyTime });
    router.push('/(onboarding)/disclaimer');
  };

  return (
    <OnboardingScaffold
      step={6}
      ctaLabel="Next"
      ctaDisabled={!supportStyle || !dailyTime}
      onBack={() => router.back()}
      onCtaPress={handleNext}>
      <Text className="text-[26px] font-bold text-revive-ink dark:text-revive-ink-dark">
        How can we support you?
      </Text>
      <Text className="mt-3 text-base leading-6 text-revive-muted dark:text-revive-muted-dark">
        We&apos;ll shape your daily routine around what actually helps you.
      </Text>

      <Text className="mt-7 text-base font-semibold text-revive-ink dark:text-revive-ink-dark">
        What helps you most?
      </Text>
      <View className="mt-4">
        {SUPPORT_STYLES.map((style) => (
          <OptionRow
            key={style}
            label={style}
            selected={supportStyle === style}
            onPress={() => setSupportStyle(style)}
          />
        ))}
      </View>

      <Text className="mt-4 text-base font-semibold text-revive-ink dark:text-revive-ink-dark">
        How much time can you give daily?
      </Text>
      <View className="mt-4">
        {DAILY_TIMES.map((time) => (
          <OptionRow
            key={time}
            label={time}
            selected={dailyTime === time}
            onPress={() => setDailyTime(time)}
          />
        ))}
      </View>
    </OnboardingScaffold>
  );
}
