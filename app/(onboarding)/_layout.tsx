import { Stack } from 'expo-router';

import { palette } from '@/constants/Colors';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        // Onboarding is strictly sequential: no back swipes, no back button.
        gestureEnabled: false,
        headerBackVisible: false,
        headerShadowVisible: false,
        headerTitleAlign: 'center',
        headerTintColor: palette.textPrimary,
      }}>
      <Stack.Screen name="index" options={{ title: 'Step 1 of 4 · Age check' }} />
      <Stack.Screen name="goals" options={{ title: 'Step 2 of 4 · Your goals' }} />
      <Stack.Screen name="triggers" options={{ title: 'Step 3 of 4 · Triggers' }} />
      <Stack.Screen name="disclaimer" options={{ title: 'Step 4 of 4 · Before we start' }} />
    </Stack>
  );
}
