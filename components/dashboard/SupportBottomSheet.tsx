import { useRouter } from 'expo-router';
import { Modal, Pressable, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMainNavigation } from '@/components/navigation/NavigationContext';

type SupportOption =
  | { emoji: string; label: string; type: 'modal'; href: '/(modals)/panic-mode' | '/(modals)/crisis-resources' }
  | { emoji: string; label: string; type: 'tab'; tab: 'coach' };

/**
 * Breathing, Emergency Reset, and Grounding Exercise all route to the same
 * panic-mode screen — it already delivers a breathing orb + a grounding list,
 * so three near-duplicate screens weren't warranted. This consolidation is
 * deliberate, not an oversight.
 */
const SUPPORT_OPTIONS: SupportOption[] = [
  { emoji: '🧘', label: 'Breathing', type: 'modal', href: '/(modals)/panic-mode' },
  { emoji: '🆘', label: 'SOS', type: 'modal', href: '/(modals)/crisis-resources' },
  { emoji: '💬', label: 'Talk with Coach', type: 'tab', tab: 'coach' },
  { emoji: '🔄', label: 'Emergency Reset', type: 'modal', href: '/(modals)/panic-mode' },
  { emoji: '🌍', label: 'Grounding Exercise', type: 'modal', href: '/(modals)/panic-mode' },
];

type SupportBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
};

/** The calm support menu opened by the draggable bubble. */
export default function SupportBottomSheet({ visible, onClose }: SupportBottomSheetProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { goToTab } = useMainNavigation();

  const choose = (option: SupportOption) => {
    onClose();
    if (option.type === 'modal') router.push(option.href);
    else goToTab(option.tab);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Animated.View entering={FadeInUp.duration(300)}>
          <Pressable
            className="rounded-t-[28px] bg-revive-card p-6 dark:bg-revive-card-dark"
            style={{ paddingBottom: insets.bottom + 24 }}
            onPress={(e) => e.stopPropagation()}>
            <View className="mb-5 h-1.5 w-10 self-center rounded-full bg-revive-secondary/60" />
            <Text className="text-xl font-semibold text-revive-ink dark:text-revive-ink-dark">
              I Need Support 🌿
            </Text>
            <Text className="mt-1 text-sm text-revive-muted dark:text-revive-muted-dark">
              That took courage. What would help most?
            </Text>

            <View className="mt-5">
              {SUPPORT_OPTIONS.map((option) => (
                <Pressable
                  key={option.label}
                  accessibilityRole="button"
                  onPress={() => choose(option)}
                  className="mb-2.5 flex-row items-center rounded-2xl bg-revive-mist px-4 py-3.5 active:scale-95 dark:bg-revive-mist-dark">
                  <Text className="text-xl">{option.emoji}</Text>
                  <Text className="ml-3 text-base font-medium text-revive-ink dark:text-revive-ink-dark">
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable onPress={onClose} className="mt-2 items-center py-3">
              <Text className="text-base font-medium text-revive-muted dark:text-revive-muted-dark">
                I&apos;m okay for now
              </Text>
            </Pressable>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
