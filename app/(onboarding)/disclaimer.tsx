import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import OnboardingScaffold from '@/components/OnboardingScaffold';
import { useAppStore } from '@/stores/appStore';

export default function DisclaimerScreen() {
  const router = useRouter();
  const setOnboardingComplete = useAppStore((state) => state.setOnboardingComplete);
  const updateProfile = useAppStore((state) => state.updateProfile);

  const handleAgree = () => {
    updateProfile({ completedAt: new Date().toISOString() });
    setOnboardingComplete(true);
    router.replace('/(tabs)/dashboard');
  };

  return (
    <OnboardingScaffold
      step={7}
      ctaLabel="I Understand"
      onBack={() => router.back()}
      onCtaPress={handleAgree}>
      <Text className="text-[26px] font-bold text-revive-ink dark:text-revive-ink-dark">
        Before we start
      </Text>
      <Text className="mt-4 text-base leading-6 text-revive-muted dark:text-revive-muted-dark">
        Revive is a self-help companion. It does{' '}
        <Text className="font-semibold text-revive-ink dark:text-revive-ink-dark">
          not replace professional medical advice, therapy, or treatment
        </Text>
        .
      </Text>

      <View className="mt-5 rounded-2xl bg-revive-mist p-5 dark:bg-revive-mist-dark">
        <Text className="text-base leading-6 text-revive-ink dark:text-revive-ink-dark">
          • Your coach offers encouragement and coping ideas, not clinical advice
          or diagnoses.{'\n\n'}
          • If you are in immediate danger or thinking about harming yourself,
          seek emergency support or call your local emergency number right away.
          {'\n\n'}
          • Community reflections come from other members, not professionals.
        </Text>
      </View>

      <Text className="mt-5 text-base leading-6 text-revive-muted dark:text-revive-muted-dark">
        By continuing you agree to use Revive as a companion to — not a
        replacement for — professional help.
      </Text>
    </OnboardingScaffold>
  );
}
