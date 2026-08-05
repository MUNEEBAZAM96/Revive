import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Check from 'lucide-react-native/icons/check';
import Sparkles from 'lucide-react-native/icons/sparkles';
import X from 'lucide-react-native/icons/x';

import SubscriptionCard from '@/components/coach/SubscriptionCard';
import { useReviveColors } from '@/components/dashboard/theme';
import { useSubscription } from '@/hooks/useSubscription';
import { yearlySavingsPercent, type PlanId } from '@/services/subscriptionService';

const BENEFITS = [
  'Unlimited AI conversations',
  'Personalized coaching',
  'Recovery insights',
  'Trigger analysis',
  'Advanced progress reports',
  'Priority access to new AI features',
  'Future premium features included',
];

const PARTICLE_EMOJI = ['🌿', '✨', '💚', '🌱'];

function CelebrationBurst() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 160 }}>
      {PARTICLE_EMOJI.map((emoji, i) => (
        <Particle key={i} emoji={emoji} index={i} />
      ))}
    </View>
  );
}

function Particle({ emoji, index }: { emoji: string; index: number }) {
  const progress = useSharedValue(0);
  const left = 20 + index * 22 + (index % 2 === 0 ? 8 : -8);

  useEffect(() => {
    progress.value = withDelay(index * 90, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateY: -progress.value * 90 },
      { scale: 0.6 + progress.value * 0.8 },
    ],
  }));

  return (
    <Animated.Text style={[style, { position: 'absolute', left: `${left}%`, top: 60, fontSize: 22 }]}>
      {emoji}
    </Animated.Text>
  );
}

function AmbientHero() {
  const colors = useReviveColors();
  const breathe = useSharedValue(1);

  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: breathe.value }] }));

  return (
    <View className="items-center justify-center py-2">
      <Animated.View
        style={[style, { backgroundColor: colors.mist }]}
        className="h-24 w-24 items-center justify-center rounded-full">
        <Sparkles size={38} color={colors.primary} />
      </Animated.View>
    </View>
  );
}

type PremiumPaywallProps = {
  /** Called after a successful purchase/restore's "Continue" is tapped, or the paywall is dismissed without one. */
  onDismiss: () => void;
};

/**
 * Revive's own paywall — hero, benefits, pricing, a single clear CTA,
 * restore/legal in the footer. It's the fallback for `app/premium-paywall.tsx`,
 * used when no RevenueCat paywall is configured for the offering or the SDK
 * can't run in this build.
 *
 * Every price shown here comes from the store via `plans` (RevenueCat
 * offering → packages), never from constants — so what someone reads is what
 * they're charged, in their own currency.
 */
export default function PremiumPaywall({ onDismiss }: PremiumPaywallProps) {
  const colors = useReviveColors();
  const { plans, purchase, restore, isBusy, status, lastError, clearError, unavailable } =
    useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('yearly');
  const [celebration, setCelebration] = useState<'purchase' | 'restore' | null>(null);

  const close = () => onDismiss();

  // Offerings load asynchronously; if the yearly plan isn't in this offering,
  // fall back to whatever the first available plan is rather than showing a
  // selected-but-unbuyable option.
  const selectedPlanDef = plans.find((p) => p.id === selectedPlan) ?? plans[0];
  const canPurchase = Boolean(selectedPlanDef?.pkg) && !unavailable;

  const handlePurchase = async () => {
    if (!selectedPlanDef) return;
    clearError();
    const success = await purchase(selectedPlanDef.pkg ?? selectedPlanDef.id);
    if (success) setCelebration('purchase');
  };

  const handleRestore = async () => {
    clearError();
    const success = await restore();
    if (success) setCelebration('restore');
  };

  const openLegal = (title: string) => {
    Alert.alert(title, 'This is placeholder legal copy — add your real policy text here before release.');
  };

  const savings = useMemo(() => yearlySavingsPercent(plans), [plans]);

  const ctaLabel = !canPurchase
    ? 'Loading plans…'
    : selectedPlanDef.trialDays > 0
      ? 'Start Free Trial'
      : selectedPlanDef.id === 'lifetime'
        ? 'Unlock Revive Pro Forever'
        : 'Unlock Revive Pro';

  if (celebration) {
    return (
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 items-center justify-center bg-revive-bg px-8 dark:bg-revive-bg-dark">
        <View style={{ position: 'relative', alignItems: 'center' }}>
          <CelebrationBurst />
          <Animated.View
            entering={FadeIn.duration(400)}
            className="h-20 w-20 items-center justify-center rounded-full bg-revive-mist dark:bg-revive-mist-dark">
            <Text className="text-4xl">🌿</Text>
          </Animated.View>
        </View>
        <Animated.Text
          entering={FadeInDown.delay(120).duration(500)}
          className="mt-6 text-center text-[24px] font-bold text-revive-ink dark:text-revive-ink-dark">
          {celebration === 'restore' ? 'Welcome back to Revive Pro' : 'Welcome to Revive Pro'}
        </Animated.Text>
        <Animated.Text
          entering={FadeInDown.delay(200).duration(500)}
          className="mt-2 text-center text-[14px] leading-5 text-revive-muted dark:text-revive-muted-dark">
          Your AI Coach is fully unlocked — no restart needed.
        </Animated.Text>
        <Animated.View entering={FadeInDown.delay(300).duration(500)} className="mt-8 w-full">
          <Pressable
            accessibilityRole="button"
            onPress={close}
            className="items-center rounded-2xl bg-revive-primary py-4 active:scale-95 dark:bg-revive-primary-dark">
            <Text className="text-base font-bold text-white dark:text-revive-bg-dark">Continue</Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-revive-bg dark:bg-revive-bg-dark">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        onPress={close}
        hitSlop={8}
        className="absolute right-5 top-4 z-10 h-9 w-9 items-center justify-center rounded-full bg-revive-card active:opacity-70 dark:bg-revive-card-dark">
        <X size={18} color={colors.muted} />
      </Pressable>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24 }}>
        <AmbientHero />

        <Animated.Text
          entering={FadeInDown.delay(60).duration(500)}
          className="mt-2 text-center text-[26px] font-bold leading-8 text-revive-ink dark:text-revive-ink-dark">
          Your Personal AI Recovery Companion
        </Animated.Text>
        <Animated.Text
          entering={FadeInDown.delay(120).duration(500)}
          className="mt-2 text-center text-[14px] leading-5 text-revive-muted dark:text-revive-muted-dark">
          Receive personalized guidance based on your recovery journey.
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(180).duration(500)} className="mt-7 rounded-3xl bg-revive-card p-5 dark:bg-revive-card-dark">
          {BENEFITS.map((benefit, i) => (
            <View key={benefit} className={`flex-row items-center ${i > 0 ? 'mt-3' : ''}`}>
              <View className="h-5 w-5 items-center justify-center rounded-full bg-revive-mist dark:bg-revive-mist-dark">
                <Check size={12} color={colors.primary} />
              </View>
              <Text className="ml-3 flex-1 text-[14px] text-revive-ink dark:text-revive-ink-dark">
                {benefit}
              </Text>
            </View>
          ))}
        </Animated.View>

        <View className="mt-7 gap-3">
          {plans.map((plan, i) => (
            <SubscriptionCard
              key={plan.id}
              plan={plan}
              savingsPercent={plan.id === 'yearly' ? savings : null}
              selected={selectedPlanDef?.id === plan.id}
              onSelect={() => setSelectedPlan(plan.id)}
              delay={240 + i * 60}
            />
          ))}
        </View>

        {lastError && (
          <Animated.View entering={FadeIn.duration(200)} className="mt-4 rounded-2xl bg-[#D1567B1A] px-4 py-3">
            <Text className="text-[13px] font-medium text-[#D1567B]">{lastError.message}</Text>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(380).duration(500)} className="mt-6">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={ctaLabel}
            disabled={isBusy || !canPurchase}
            onPress={handlePurchase}
            className="items-center rounded-2xl bg-revive-primary py-4 active:scale-95 dark:bg-revive-primary-dark"
            style={{ opacity: isBusy || !canPurchase ? 0.7 : 1 }}>
            {status === 'purchasing' ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-base font-bold text-white dark:text-revive-bg-dark">{ctaLabel}</Text>
            )}
          </Pressable>
          {selectedPlanDef && selectedPlanDef.trialDays > 0 && (
            <Text className="mt-2 text-center text-[11px] text-revive-muted dark:text-revive-muted-dark">
              {selectedPlanDef.trialDays}-day free trial, then {selectedPlanDef.priceLabel}
              {selectedPlanDef.periodLabel}. Cancel anytime.
            </Text>
          )}
        </Animated.View>

        <Pressable
          accessibilityRole="button"
          disabled={isBusy}
          onPress={handleRestore}
          className="mt-4 items-center py-2 active:opacity-70">
          {status === 'restoring' ? (
            <ActivityIndicator color={colors.muted} />
          ) : (
            <Text className="text-[13px] font-medium text-revive-muted dark:text-revive-muted-dark">
              Restore Purchases
            </Text>
          )}
        </Pressable>

        <View className="mt-2 flex-row items-center justify-center gap-4">
          <Pressable accessibilityRole="button" onPress={() => openLegal('Privacy Policy')}>
            <Text className="text-[11px] text-revive-muted underline dark:text-revive-muted-dark">
              Privacy Policy
            </Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => openLegal('Terms of Service')}>
            <Text className="text-[11px] text-revive-muted underline dark:text-revive-muted-dark">
              Terms of Service
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
