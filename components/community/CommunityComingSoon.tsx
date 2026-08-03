import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useMainNavigation } from '@/components/navigation/NavigationContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

/**
 * Premium placeholder shown while Community is gated off
 * (FEATURES.communityEnabled === false). Reads as "coming soon", not "broken"
 * — calm entrance, a slow floating+breathing leaf, no loading states or
 * empty-feed UI. See components/community/CommunityScreen.tsx for the flag branch.
 */
export default function CommunityComingSoon() {
  const { goToTab } = useMainNavigation();

  const floatY = useSharedValue(0);
  const breathe = useSharedValue(1);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
    breathe.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(1.06, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const leafStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }, { scale: breathe.value }],
  }));

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-revive-bg dark:bg-revive-bg-dark">
      <View className="flex-1 items-center justify-center px-8">
        <Animated.View
          entering={FadeInDown.delay(0).duration(600)}
          style={leafStyle}
          className="h-24 w-24 items-center justify-center rounded-full bg-revive-mist dark:bg-revive-mist-dark">
          <Text className="text-5xl">🌿</Text>
        </Animated.View>

        <Animated.Text
          entering={FadeInDown.delay(160).duration(550)}
          className="mt-7 text-[28px] font-bold text-revive-ink dark:text-revive-ink-dark">
          Community
        </Animated.Text>

        <Animated.Text
          entering={FadeInDown.delay(240).duration(550)}
          className="mt-2 text-[15px] font-semibold text-revive-primary dark:text-revive-primary-dark">
          Recovery is better together.
        </Animated.Text>

        <Animated.Text
          entering={FadeInDown.delay(320).duration(550)}
          className="mt-4 max-w-[300px] text-center text-[14px] leading-6 text-revive-muted dark:text-revive-muted-dark">
          We're building a safe, supportive space to share your progress, celebrate milestones, and
          encourage one another — without judgment, without pressure.
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(400).duration(550)} className="mt-6">
          <View className="rounded-full bg-revive-mist px-4 py-2 dark:bg-revive-mist-dark">
            <Text className="text-[12px] font-bold uppercase tracking-wide text-revive-primary dark:text-revive-primary-dark">
              Coming Soon
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(480).duration(550)} className="mt-10 w-full">
          <Pressable
            accessibilityRole="button"
            onPress={() => goToTab('dashboard')}
            className="items-center rounded-2xl bg-revive-primary py-4 active:scale-95 dark:bg-revive-primary-dark">
            <Text className="text-base font-bold text-white dark:text-revive-bg-dark">
              Continue Journey
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
