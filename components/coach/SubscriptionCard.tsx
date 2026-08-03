import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { yearlySavingsPercent, type PricingPlan } from '@/services/subscriptionService';

type SubscriptionCardProps = {
  plan: PricingPlan;
  selected: boolean;
  onSelect: () => void;
  delay?: number;
};

/** A single selectable pricing plan — used on the paywall and reused (read-only) in Settings' subscription section. */
export default function SubscriptionCard({ plan, selected, onSelect, delay = 0 }: SubscriptionCardProps) {
  const savings = plan.id === 'yearly' ? yearlySavingsPercent() : null;

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(450)}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${plan.id} plan, ${plan.priceLabel}${plan.periodLabel}`}
        onPress={onSelect}
        className={`relative overflow-visible rounded-3xl border-2 p-5 active:opacity-90 ${
          selected
            ? 'border-revive-primary bg-revive-mist dark:border-revive-primary-dark dark:bg-revive-mist-dark'
            : 'border-transparent bg-revive-card dark:bg-revive-card-dark'
        }`}
        style={{ boxShadow: '0px 4px 14px rgba(26, 58, 44, 0.06)' }}>
        {plan.badge && (
          <View
            className="absolute -top-3 left-5 rounded-full px-3 py-1 bg-revive-primary dark:bg-revive-primary-dark"
            style={{ boxShadow: '0px 2px 6px rgba(26, 58, 44, 0.18)' }}>
            <Text className="text-[10px] font-bold uppercase tracking-wide text-white dark:text-revive-bg-dark">
              {plan.badge}
            </Text>
          </View>
        )}

        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-[13px] font-semibold capitalize text-revive-muted dark:text-revive-muted-dark">
              {plan.id}
            </Text>
            <View className="mt-1 flex-row items-baseline">
              <Text className="text-[26px] font-bold text-revive-ink dark:text-revive-ink-dark">
                {plan.priceLabel}
              </Text>
              <Text className="ml-1 text-[13px] text-revive-muted dark:text-revive-muted-dark">
                {plan.periodLabel}
              </Text>
            </View>
            <Text className="mt-1 text-[12px] text-revive-muted dark:text-revive-muted-dark">
              {plan.billingNote}
            </Text>
            {savings !== null && (
              <Text className="mt-1 text-[12px] font-semibold text-revive-primary dark:text-revive-primary-dark">
                Save {savings}% vs. monthly
              </Text>
            )}
          </View>

          <View
            className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
              selected
                ? 'border-revive-primary bg-revive-primary dark:border-revive-primary-dark dark:bg-revive-primary-dark'
                : 'border-revive-secondary/60'
            }`}>
            {selected && <View className="h-2.5 w-2.5 rounded-full bg-white dark:bg-revive-bg-dark" />}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
