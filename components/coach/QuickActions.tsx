import { Pressable, ScrollView, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { QUICK_ACTIONS, type QuickAction } from '@/services/coachService';

type QuickActionsProps = {
  onSelect: (action: QuickAction) => void;
  delay?: number;
};

/** Horizontal row of rounded chips — each one starts a new conversation with a pre-filled prompt. */
export default function QuickActions({ onSelect, delay = 0 }: QuickActionsProps) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(500)}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 20, gap: 10 }}>
        {QUICK_ACTIONS.map((action, index) => (
          <Animated.View key={action.id} entering={FadeInDown.delay(delay + 40 + index * 30).duration(400)}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={action.label}
              onPress={() => onSelect(action)}
              className="flex-row items-center rounded-full bg-revive-card px-4 py-2.5 active:scale-95 dark:bg-revive-card-dark"
              style={{ boxShadow: '0px 3px 10px rgba(26, 58, 44, 0.06)' }}>
              <Text className="text-base">{action.emoji}</Text>
              <Text className="ml-2 text-[13px] font-semibold text-revive-ink dark:text-revive-ink-dark">
                {action.label}
              </Text>
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>
    </Animated.View>
  );
}
