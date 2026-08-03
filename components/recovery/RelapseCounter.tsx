import { Pressable, Text, View } from 'react-native';

const OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3+' },
];

const RELAPSE_COLOR = '#D1567B';

type RelapseCounterProps = {
  value: number | null;
  onChange: (count: number) => void;
};

/** How many times today — a plain three-way choice, no number entry. */
export default function RelapseCounter({ value, onChange }: RelapseCounterProps) {
  return (
    <View className="flex-row gap-2.5">
      {OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            className="flex-1 items-center justify-center rounded-2xl py-3.5 active:scale-95"
            style={{ backgroundColor: selected ? RELAPSE_COLOR : `${RELAPSE_COLOR}14` }}>
            <Text
              className={`text-[16px] font-bold ${selected ? 'text-white' : ''}`}
              style={!selected ? { color: RELAPSE_COLOR } : undefined}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
