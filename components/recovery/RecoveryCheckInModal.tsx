import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { STATUS_META, type CheckInStatus, type TriggerType } from '@/services/checkInService';
import { useRecoveryCheckIn } from '@/hooks/useRecoveryCheckIn';

import RecoveryOptionButton from './RecoveryOptionButton';
import RelapseCounter from './RelapseCounter';
import TriggerSelector from './TriggerSelector';
import UrgeSlider from './UrgeSlider';

type Step = 'status' | 'urge_level' | 'relapse_count' | 'trigger' | 'confirmation';

type RecoveryCheckInModalProps = {
  visible: boolean;
  onClose: () => void;
};

const CONFIRMATION_COPY: Record<CheckInStatus, { emoji: string; message: string }> = {
  success: { emoji: '🌿', message: 'Great work. Keep building your momentum.' },
  urge: { emoji: '🌱', message: 'Awareness is progress.' },
  relapse: { emoji: '🌱', message: 'This is a storm, not the end of your journey.' },
};

/**
 * The full check-in flow: one tap for the common case (Stayed on track),
 * up to two follow-up taps for the others. Every step both fades in and the
 * sheet itself slides up on open — kept subtle, no bounce.
 */
export default function RecoveryCheckInModal({ visible, onClose }: RecoveryCheckInModalProps) {
  const insets = useSafeAreaInsets();
  const { isCatchUp, submitCheckIn } = useRecoveryCheckIn();

  const [step, setStep] = useState<Step>('status');
  const [status, setStatus] = useState<CheckInStatus | null>(null);
  const [relapseCount, setRelapseCount] = useState<number | null>(null);
  const [trigger, setTrigger] = useState<TriggerType | null>(null);

  useEffect(() => {
    if (visible) {
      setStep('status');
      setStatus(null);
      setRelapseCount(null);
      setTrigger(null);
    }
  }, [visible]);

  const chooseStatus = (value: CheckInStatus) => {
    setStatus(value);
    if (value === 'success') {
      submitCheckIn({ status: 'success' });
      setStep('confirmation');
    } else if (value === 'urge') {
      setStep('urge_level');
    } else {
      setStep('relapse_count');
    }
  };

  const chooseUrgeLevel = (level: number) => {
    submitCheckIn({ status: 'urge', urgeLevel: level });
    setStep('confirmation');
  };

  const chooseRelapseCount = (count: number) => {
    setRelapseCount(count);
    // Save immediately (offline-first: never wait on the next optional
    // step) — the trigger, if chosen, updates this same day's record after.
    submitCheckIn({ status: 'relapse', relapseCount: count, trigger: null });
    setStep('trigger');
  };

  const chooseTrigger = (value: TriggerType) => {
    setTrigger(value);
    submitCheckIn({ status: 'relapse', relapseCount: relapseCount ?? 1, trigger: value });
    setStep('confirmation');
  };

  const confirmation = status ? CONFIRMATION_COPY[status] : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <Animated.View
          entering={SlideInDown.duration(350).springify().damping(20)}
          className="rounded-t-[32px] bg-revive-bg p-6 dark:bg-revive-bg-dark"
          style={{ paddingBottom: insets.bottom + 24 }}>
          <View className="mb-5 h-1.5 w-10 self-center rounded-full bg-revive-secondary/60" />

          {step === 'status' && (
            <Animated.View key="status" entering={FadeIn.duration(250)}>
              <Text className="text-2xl">🌿</Text>
              <Text className="mt-2 text-2xl font-bold text-revive-ink dark:text-revive-ink-dark">
                {isCatchUp ? 'Welcome Back' : 'Daily Reflection'}
              </Text>
              <Text className="mt-1.5 text-[14px] leading-5 text-revive-muted dark:text-revive-muted-dark">
                {isCatchUp
                  ? 'During the last few days, how did things go?'
                  : 'How did your recovery go today?'}
              </Text>

              <View className="mt-6">
                <RecoveryOptionButton
                  emoji="🟢"
                  color={STATUS_META.success.color}
                  label="Stayed on track"
                  onPress={() => chooseStatus('success')}
                  delay={0}
                />
                <RecoveryOptionButton
                  emoji="🟡"
                  color={STATUS_META.urge.color}
                  label={isCatchUp ? 'Had difficulties' : 'Had urges'}
                  onPress={() => chooseStatus('urge')}
                  delay={60}
                />
                <RecoveryOptionButton
                  emoji="🔴"
                  color={STATUS_META.relapse.color}
                  label="Relapse"
                  onPress={() => chooseStatus('relapse')}
                  delay={120}
                />
              </View>
            </Animated.View>
          )}

          {step === 'urge_level' && (
            <Animated.View key="urge_level" entering={FadeIn.duration(250)}>
              <Text className="text-xl font-bold text-revive-ink dark:text-revive-ink-dark">
                How strong were your urges?
              </Text>
              <UrgeSlider value={null} onChange={chooseUrgeLevel} />
            </Animated.View>
          )}

          {step === 'relapse_count' && (
            <Animated.View key="relapse_count" entering={FadeIn.duration(250)}>
              <Text className="text-xl font-bold text-revive-ink dark:text-revive-ink-dark">
                How many times?
              </Text>
              <View className="mt-5">
                <RelapseCounter value={relapseCount} onChange={chooseRelapseCount} />
              </View>
            </Animated.View>
          )}

          {step === 'trigger' && (
            <Animated.View key="trigger" entering={FadeIn.duration(250)}>
              <Text className="text-xl font-bold text-revive-ink dark:text-revive-ink-dark">
                Main trigger?
              </Text>
              <Text className="mt-1 text-[13px] text-revive-muted dark:text-revive-muted-dark">
                Optional — only if it helps to name it.
              </Text>
              <View className="mt-5">
                <TriggerSelector value={trigger} onChange={chooseTrigger} />
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => setStep('confirmation')}
                className="mt-5 items-center py-2">
                <Text className="text-[14px] font-medium text-revive-muted dark:text-revive-muted-dark">
                  Skip
                </Text>
              </Pressable>
            </Animated.View>
          )}

          {step === 'confirmation' && confirmation && (
            <Animated.View key="confirmation" entering={FadeIn.duration(300)} className="items-center py-4">
              <Text className="text-5xl">{confirmation.emoji}</Text>
              <Text className="mt-4 text-center text-[18px] font-semibold leading-6 text-revive-ink dark:text-revive-ink-dark">
                {confirmation.message}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={onClose}
                className="mt-7 w-full items-center rounded-2xl bg-revive-primary py-4 active:scale-95 dark:bg-revive-primary-dark">
                <Text className="text-base font-bold text-white dark:text-revive-bg-dark">Continue</Text>
              </Pressable>
            </Animated.View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}
