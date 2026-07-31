import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { LogBox } from 'react-native';
import 'react-native-reanimated';

import '../global.css';

if (__DEV__) {
  // Expo Go activates expo-keep-awake in dev without a .catch(); on Android the
  // native call fails transiently when the app isn't foregrounded during a
  // reload. Harmless — worst case the screen sleeps while developing.
  LogBox.ignoreLogs([/Unable to activate keep awake/]);
}

import { useColorScheme } from '@/components/useColorScheme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Anchor deep links / reloads on the switchboard so redirect logic always runs.
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          animation: 'slide_from_right',
          animationDuration: 250,
          fullScreenGestureEnabled: true,
          freezeOnBlur: true,
        }}>
        <Stack.Screen name="index" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />

        {/* Global Modals */}
        <Stack.Screen
          name="(modals)/panic-mode"
          options={{
            presentation: 'fullScreenModal',
            title: 'Panic Mode',
            headerShown: false,
            // Open instantly — this is the emergency path.
            animation: 'fade',
            animationDuration: 150,
            // Panic Mode should only be dismissed via its own buttons.
            gestureEnabled: false,
            fullScreenGestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="(modals)/crisis-resources"
          options={{
            presentation: 'modal',
            title: 'Crisis Support',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="(modals)/daily-check-in"
          options={{
            presentation: 'modal',
            title: 'Daily Check-in',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="(modals)/journey-calendar"
          options={{
            presentation: 'modal',
            title: 'Your Journey',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
