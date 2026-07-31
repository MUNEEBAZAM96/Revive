import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        // Full-bleed like the Dashboard; the in-screen progress bar and back
        // chevron replace the native header. Sequential: no back swipe.
        headerShown: false,
        gestureEnabled: false,
        animation: 'slide_from_right',
        animationDuration: 250,
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="age" />
      <Stack.Screen name="focus" />
      <Stack.Screen name="goal" />
      <Stack.Screen name="triggers" />
      <Stack.Screen name="impact" />
      <Stack.Screen name="support" />
      <Stack.Screen name="disclaimer" />
    </Stack>
  );
}
