import { Pressable, Text, View } from 'react-native';

const LEVELS = [1, 2, 3, 4, 5];
const URGE_COLOR = '#F2617D';

type UrgeSliderProps = {
  value: number | null;
  onChange: (level: number) => void;
};

/**
 * A 1–5 urge-intensity picker. Built as five tappable stops on a connected
 * track rather than a true drag-slider — a single tap is faster and more
 * reliable than a precision drag gesture, which matters for a "one-tap,
 * under 15 seconds" interaction.
 */
export default function UrgeSlider({ value, onChange }: UrgeSliderProps) {
  return (
    <View className="mt-2">
      <View className="flex-row items-center justify-between">
        {LEVELS.map((level) => {
          const selected = value === level;
          return (
            <Pressable
              key={level}
              accessibilityRole="button"
              accessibilityLabel={`Urge level ${level} of 5`}
              accessibilityState={{ selected }}
              onPress={() => onChange(level)}
              className="h-12 w-12 items-center justify-center rounded-full active:scale-95"
              style={{
                backgroundColor: selected ? URGE_COLOR : `${URGE_COLOR}14`,
              }}>
              <Text
                className={`text-[16px] font-bold ${selected ? 'text-white' : ''}`}
                style={!selected ? { color: URGE_COLOR } : undefined}>
                {level}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View className="mt-2.5 flex-row justify-between px-1">
        <Text className="text-[12px] text-revive-muted dark:text-revive-muted-dark">Mild</Text>
        <Text className="text-[12px] text-revive-muted dark:text-revive-muted-dark">Intense</Text>
      </View>
    </View>
  );
}
