import { Stack } from 'expo-router';

import { palette } from '@/constants/Colors';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        // Onboarding is strictly sequential: no back swipes, no back button.
        gestureEnabled: false,
        animation: 'slide_from_right',
        animationDuration: 250,
        headerBackVisible: false,
        headerShadowVisible: false,
        headerTitleAlign: 'center',
        headerTintColor: palette.textPrimary,
        headerStyle: { backgroundColor: palette.surface },
      }}>
      {/* The in-screen progress bar shows the step count. */}
      <Stack.Screen name="index" options={{ title: 'Age check' }} />
      <Stack.Screen name="goals" options={{ title: 'Your goals' }} />
      <Stack.Screen name="triggers" options={{ title: 'Triggers' }} />
      <Stack.Screen name="disclaimer" options={{ title: 'Before we start' }} />
    </Stack>
  );
}
