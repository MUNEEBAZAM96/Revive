import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import '../global.css';

if (__DEV__) {
  // Expo's dev tools activate expo-keep-awake without a .catch(); on Android in
  // Expo Go the native call rejects transiently before the Activity is ready,
  // surfacing as an uncaught promise rejection. It's harmless (worst case the
  // screen sleeps while developing) and never happens in production.
  LogBox.ignoreLogs([/Unable to activate keep awake/]);

  // ignoreLogs only hides log warnings, not uncaught rejections — so filter the
  // rejection itself: swallow just this one, pass everything else through.
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const rejectionTracking = require('promise/setimmediate/rejection-tracking');
    rejectionTracking.enable({
      allRejections: true,
      onUnhandled: (id: number, error: unknown) => {
        const message =
          error && typeof error === 'object' && 'message' in error
            ? String((error as { message: unknown }).message)
            : String(error);
        if (message.includes('activate keep awake')) return; // benign dev noise
        console.error(`Possible unhandled promise rejection (id: ${id}):`, error);
      },
      onHandled: () => {},
    });
  } catch {
    /* rejection-tracking unavailable — nothing to filter */
  }
}

import { useAppBootstrap } from '@/hooks/useAppBootstrap';
import ReviveSplash from '@/components/ReviveSplash';
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

  // Open + migrate the local SQLite database (and seed dev data) before the UI
  // renders, so screens always read from a ready local-first store.
  const dbReady = useAppBootstrap();

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && dbReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, dbReady]);

  if (!loaded || !dbReady) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  // The animated brand splash overlays the app once, then fades away.
  const [splashDone, setSplashDone] = useState(false);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        {/* Android draws behind the status bar (edgeToEdgeEnabled) — set icon
            contrast per theme so it stays legible; screens with a permanently
            dark background (e.g. panic-mode) override this locally. */}
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} translucent />
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
        <Stack.Screen
          name="(modals)/rewards-shop"
          options={{
            presentation: 'modal',
            title: 'Rewards Shop',
            animation: 'slide_from_bottom',
          }}
        />
        </Stack>
      </ThemeProvider>
      {!splashDone && <ReviveSplash onFinish={() => setSplashDone(true)} />}
    </GestureHandlerRootView>
  );
}
