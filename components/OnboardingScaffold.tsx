import { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette } from '@/constants/Colors';

const TOTAL_STEPS = 4;

type Props = PropsWithChildren<{
  /** 1-based onboarding step, fills the progress bar. */
  step: number;
  ctaLabel: string;
  onCtaPress: () => void;
  ctaVariant?: 'primary' | 'secondary';
}>;

/**
 * Shared shell for onboarding steps: progress bar, scrollable content that
 * never clips on small screens, and a CTA pinned above the keyboard.
 */
export default function OnboardingScaffold({
  step,
  ctaLabel,
  onCtaPress,
  ctaVariant = 'primary',
  children,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}>
      <View style={styles.progressRow}>
        {Array.from({ length: TOTAL_STEPS }, (_, index) => (
          <View
            key={index}
            style={[
              styles.progressSegment,
              index < step && styles.progressSegmentActive,
            ]}
          />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic">
        <Animated.View entering={FadeInDown.duration(350)}>{children}</Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <Pressable
          style={({ pressed }) => [
            ctaVariant === 'primary' ? styles.primaryButton : styles.secondaryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={onCtaPress}>
          <Text
            style={
              ctaVariant === 'primary'
                ? styles.primaryButtonText
                : styles.secondaryButtonText
            }>
            {ctaLabel}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.surface },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.border,
  },
  progressSegmentActive: { backgroundColor: palette.primary },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  footer: { paddingHorizontal: 24, paddingTop: 8, backgroundColor: palette.surface },
  primaryButton: {
    backgroundColor: palette.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: palette.primaryDark,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: palette.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: { color: palette.primary, fontSize: 16, fontWeight: '600' },
  buttonPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
});
