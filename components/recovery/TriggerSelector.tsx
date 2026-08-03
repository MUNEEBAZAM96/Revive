import { Pressable, Text, View } from 'react-native';

import { TRIGGER_OPTIONS, TriggerType } from '@/services/checkInService';

type TriggerSelectorProps = {
  value: TriggerType | null;
  onChange: (trigger: TriggerType) => void;
};

/** Optional single-select trigger chips. Selecting one is the whole interaction. */
export default function TriggerSelector({ value, onChange }: TriggerSelectorProps) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {TRIGGER_OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            className={`rounded-full px-4 py-2.5 active:scale-95 ${
              selected
                ? 'bg-revive-primary dark:bg-revive-primary-dark'
                : 'bg-revive-mist dark:bg-revive-mist-dark'
            }`}>
            <Text
              className={`text-[13.5px] font-medium ${
                selected ? 'text-white dark:text-revive-bg-dark' : 'text-revive-ink dark:text-revive-ink-dark'
              }`}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
