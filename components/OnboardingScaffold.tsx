import FontAwesome from '@expo/vector-icons/FontAwesome';
import { PropsWithChildren } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useReviveColors } from '@/components/dashboard/theme';

const DEFAULT_TOTAL_STEPS = 7;

type Props = PropsWithChildren<{
  /** 1-based question step; fills the progress bar. */
  step: number;
  totalSteps?: number;
  ctaLabel: string;
  onCtaPress: () => void;
  ctaDisabled?: boolean;
  ctaVariant?: 'primary' | 'secondary';
  /** When provided, shows a back chevron top-left. */
  onBack?: () => void;
}>;

/**
 * Shared shell for onboarding steps, styled to match the Dashboard (Revive
 * palette, dark mode, soft entrance animation). Progress bar + a CTA that
 * stays disabled until the step is answered.
 */
export default function OnboardingScaffold({
  step,
  totalSteps = DEFAULT_TOTAL_STEPS,
  ctaLabel,
  onCtaPress,
  ctaDisabled = false,
  ctaVariant = 'primary',
  onBack,
  children,
}: Props) {
  const colors = useReviveColors();

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      className="flex-1 bg-revive-bg dark:bg-revive-bg-dark">
      <View className="flex-row items-center gap-3 px-6 pt-2">
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={12}
            onPress={onBack}
            className="h-8 w-8 items-center justify-center rounded-full active:opacity-70">
            <FontAwesome name="chevron-left" size={16} color={colors.muted} />
          </Pressable>
        ) : (
          <View className="h-8 w-8" />
        )}
        <View className="flex-1 flex-row gap-1.5">
          {Array.from({ length: totalSteps }, (_, index) => (
            <View
              key={index}
              className={`h-1 flex-1 rounded-full ${
                index < step
                  ? 'bg-revive-primary dark:bg-revive-primary-dark'
                  : 'bg-revive-mist dark:bg-revive-mist-dark'
              }`}
            />
          ))}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="grow px-6 pb-6 pt-7">
        <Animated.View entering={FadeInDown.duration(400)}>{children}</Animated.View>
      </ScrollView>

      <View className="px-6 pb-2 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: ctaDisabled }}
          disabled={ctaDisabled}
          onPress={onCtaPress}
          className={`items-center rounded-2xl py-4 ${
            ctaVariant === 'primary'
              ? 'bg-revive-primary dark:bg-revive-primary-dark'
              : 'border-2 border-revive-primary dark:border-revive-primary-dark'
          } ${ctaDisabled ? 'opacity-40' : 'active:opacity-90'}`}>
          <Text
            className={`text-base font-semibold ${
              ctaVariant === 'primary'
                ? 'text-white dark:text-revive-bg-dark'
                : 'text-revive-primary dark:text-revive-primary-dark'
            }`}>
            {ctaLabel}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
