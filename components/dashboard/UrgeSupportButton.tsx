import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SupportOption = {
  emoji: string;
  label: string;
  route: '/(modals)/panic-mode' | '/(tabs)/coach';
};

const SUPPORT_OPTIONS: SupportOption[] = [
  { emoji: '🔥', label: 'Strong urge', route: '/(modals)/panic-mode' },
  { emoji: '😰', label: 'Anxiety', route: '/(modals)/panic-mode' },
  { emoji: '😔', label: 'Feeling low', route: '/(tabs)/coach' },
  { emoji: '💬', label: 'Talk to Coach', route: '/(tabs)/coach' },
  { emoji: '🌬️', label: 'Breathing Exercise', route: '/(modals)/panic-mode' },
];

/**
 * Revive's signature feature: calm, always-reachable support. Deliberately
 * not an aggressive red emergency button — asking for help should feel safe.
 */
export default function UrgeSupportButton() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const choose = (route: SupportOption['route']) => {
    setOpen(false);
    router.push(route);
  };

  return (
    <>
      <Animated.View
        style={[
          pulseStyle,
          {
            position: 'absolute',
            right: 20,
            bottom: insets.bottom + (Platform.OS === 'web' ? 76 : 66),
            boxShadow: '0px 5px 12px rgba(26, 58, 44, 0.25)',
          },
        ]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="I need support"
          onPress={() => setOpen(true)}
          className="flex-row items-center rounded-full bg-revive-primary py-3.5 pl-4 pr-5 active:opacity-90 dark:bg-revive-primary-dark">
          <Text className="text-lg">🌿</Text>
          <Text className="ml-2 text-[15px] font-semibold text-white dark:text-revive-bg-dark">
            I Need Support
          </Text>
        </Pressable>
      </Animated.View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setOpen(false)}>
          <Pressable
            className="rounded-t-[28px] bg-revive-card p-6 dark:bg-revive-card-dark"
            style={{ paddingBottom: insets.bottom + 24 }}
            onPress={(event) => event.stopPropagation()}>
            <View className="mb-5 h-1.5 w-10 self-center rounded-full bg-revive-secondary/60" />
            <Text className="text-xl font-semibold text-revive-ink dark:text-revive-ink-dark">
              I am struggling right now
            </Text>
            <Text className="mt-1 text-sm text-revive-muted dark:text-revive-muted-dark">
              That took courage. What would help most?
            </Text>

            <View className="mt-5">
              {SUPPORT_OPTIONS.map((option) => (
                <Pressable
                  key={option.label}
                  accessibilityRole="button"
                  onPress={() => choose(option.route)}
                  className="mb-2.5 flex-row items-center rounded-2xl bg-revive-mist px-4 py-3.5 active:opacity-85 dark:bg-revive-mist-dark">
                  <Text className="text-xl">{option.emoji}</Text>
                  <Text className="ml-3 text-base font-medium text-revive-ink dark:text-revive-ink-dark">
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => setOpen(false)}
              className="mt-2 items-center py-3">
              <Text className="text-base font-medium text-revive-muted dark:text-revive-muted-dark">
                I&apos;m okay for now
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
