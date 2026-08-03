import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const PROMISES = ['No judgment.', 'No pressure.', 'One day at a time.'];

export default function WelcomeScreen() {
  const router = useRouter();
  const float = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2600, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 2600, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
  }, [float]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value }],
  }));

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      className="flex-1 bg-revive-bg dark:bg-revive-bg-dark">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        contentContainerClassName="items-center px-8">
        <Animated.View style={floatStyle} entering={FadeIn.duration(700)}>
          <View className="h-28 w-28 items-center justify-center rounded-full bg-revive-mist dark:bg-revive-mist-dark">
            <Text className="text-5xl">🌿</Text>
          </View>
        </Animated.View>

        <Animated.Text
          entering={FadeInDown.delay(150).duration(500)}
          className="mt-8 text-center text-[32px] font-bold text-revive-ink dark:text-revive-ink-dark">
          Welcome to Revive
        </Animated.Text>
        <Animated.Text
          entering={FadeInDown.delay(280).duration(500)}
          className="mt-4 text-center text-base leading-6 text-revive-muted dark:text-revive-muted-dark">
          A private space to rebuild your habits, focus, and confidence.
        </Animated.Text>

        <Animated.View
          entering={FadeInDown.delay(420).duration(500)}
          className="mt-7 flex-row flex-wrap justify-center gap-x-3 gap-y-1">
          {PROMISES.map((line) => (
            <Text
              key={line}
              className="text-[15px] font-medium text-revive-primary dark:text-revive-primary-dark">
              {line}
            </Text>
          ))}
        </Animated.View>
      </ScrollView>

      <View className="px-6 pb-4">
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(onboarding)/age')}
          className="items-center rounded-2xl bg-revive-primary py-4 active:opacity-90 dark:bg-revive-primary-dark">
          <Text className="text-base font-semibold text-white dark:text-revive-bg-dark">
            Start My Journey
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
