import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

type RecoveryOptionButtonProps = {
  emoji: string;
  color: string;
  label: string;
  description?: string;
  onPress: () => void;
  delay?: number;
};

/**
 * A single full-width status choice (Stayed on track / Had urges / Relapse,
 * and the "Welcome Back" catch-up variant). One tap, no confirmation step —
 * the tap itself is the answer.
 */
export default function RecoveryOptionButton({
  emoji,
  color,
  label,
  description,
  onPress,
  delay = 0,
}: RecoveryOptionButtonProps) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        className="mb-3 flex-row items-center rounded-3xl bg-revive-card p-4 active:scale-[0.97] dark:bg-revive-card-dark"
        style={{ boxShadow: '0px 4px 12px rgba(26, 58, 44, 0.06)' }}>
        <View
          className="h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: `${color}1F` }}>
          <Text className="text-2xl">{emoji}</Text>
        </View>
        <View className="ml-3.5 flex-1">
          <Text className="text-[16px] font-semibold text-revive-ink dark:text-revive-ink-dark">
            {label}
          </Text>
          {description && (
            <Text className="mt-0.5 text-[12.5px] text-revive-muted dark:text-revive-muted-dark">
              {description}
            </Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}
