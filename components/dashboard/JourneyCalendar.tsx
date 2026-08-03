import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useRecoveryCheckIn } from '@/hooks/useRecoveryCheckIn';
import {
  RecoveryCheckIn,
  STATUS_META,
  todayKey as dateKey,
  TRIGGER_OPTIONS,
} from '@/services/checkInService';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type CalendarWeek = (Date | null)[];

function weeksOf(year: number, month: number): CalendarWeek[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array.from({ length: firstWeekday }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: CalendarWeek[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

function DayCell({
  date,
  record,
  isToday,
  isFuture,
  selected,
  onPress,
}: {
  date: Date;
  record: RecoveryCheckIn | undefined;
  isToday: boolean;
  isFuture: boolean;
  selected: boolean;
  onPress: () => void;
}) {
  const meta = record ? STATUS_META[record.status] : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      disabled={!record}
      onPress={onPress}
      className="m-0.5 aspect-square flex-1 items-center justify-center rounded-xl"
      style={[
        { backgroundColor: meta?.chipColor ?? 'transparent' },
        selected && { borderWidth: 2, borderColor: meta?.color ?? '#3A8D6D' },
        isToday && !selected && { borderWidth: 2, borderColor: '#A8D5BA' },
      ]}>
      <Text
        className="text-[10px]"
        style={{
          color: isFuture ? 'rgba(107,114,128,0.4)' : meta ? meta.color : undefined,
        }}>
        {date.getDate()}
      </Text>
      {meta && <Text className="text-[13px]">{meta.emoji}</Text>}
    </Pressable>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View className="flex-1 items-center rounded-2xl bg-revive-mist px-1 py-2.5 dark:bg-revive-mist-dark">
      <Text className="text-lg font-extrabold text-revive-primary dark:text-revive-primary-dark">
        {value}
      </Text>
      <Text className="mt-0.5 text-[11px] text-revive-muted dark:text-revive-muted-dark">
        {label}
      </Text>
    </View>
  );
}

/**
 * Month view of the Recovery Check-In history: 🟢 stayed on track, 🟡 had
 * urges, 🔴 relapse. Reads directly from useRecoveryCheckIn — the calendar
 * never collects data itself, it only ever displays what the check-in modal
 * already recorded.
 */
export default function JourneyCalendar() {
  const today = new Date();
  const todayDateKey = dateKey(today);
  const [viewed, setViewed] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const { checkIns, currentStreak } = useRecoveryCheckIn();

  const year = viewed.getFullYear();
  const month = viewed.getMonth();

  const weeks = useMemo(() => weeksOf(year, month), [year, month]);
  const recordsByDate = useMemo(() => {
    const map = new Map<string, RecoveryCheckIn>();
    for (const record of checkIns) map.set(record.date, record);
    return map;
  }, [checkIns]);

  const monthStats = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    let successDays = 0;
    let checkedIn = 0;
    for (const record of checkIns) {
      if (!record.date.startsWith(prefix)) continue;
      checkedIn += 1;
      if (record.status === 'success') successDays += 1;
    }
    return { successDays, checkedIn };
  }, [checkIns, year, month]);

  const monthLabel = viewed.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const selectedRecord = selectedKey ? recordsByDate.get(selectedKey) : undefined;
  const selectedDate = selectedKey ? new Date(`${selectedKey}T12:00:00`) : null;
  const selectedMeta = selectedRecord ? STATUS_META[selectedRecord.status] : null;
  const selectedTriggerLabel = selectedRecord?.trigger
    ? TRIGGER_OPTIONS.find((t) => t.value === selectedRecord.trigger)?.label
    : null;

  const changeMonth = (delta: number) => {
    setViewed((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
    setSelectedKey(null);
  };

  return (
    <Animated.View entering={FadeInDown.duration(450)}>
      {/* Month navigation */}
      <View className="flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          onPress={() => changeMonth(-1)}
          className="h-9 w-9 items-center justify-center rounded-full bg-revive-mist active:opacity-80 dark:bg-revive-mist-dark">
          <Text className="text-base font-bold text-revive-primary dark:text-revive-primary-dark">
            ‹
          </Text>
        </Pressable>
        <Text className="text-lg font-bold text-revive-ink dark:text-revive-ink-dark">
          {monthLabel}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          onPress={() => changeMonth(1)}
          className="h-9 w-9 items-center justify-center rounded-full bg-revive-mist active:opacity-80 dark:bg-revive-mist-dark">
          <Text className="text-base font-bold text-revive-primary dark:text-revive-primary-dark">
            ›
          </Text>
        </Pressable>
      </View>

      {/* Gentle stats — progress framing only */}
      <View className="mt-4 flex-row gap-2">
        <Stat value={monthStats.successDays} label="Success days" />
        <Stat value={monthStats.checkedIn} label="Check-ins" />
        <Stat value={currentStreak} label="Current streak" />
      </View>

      {/* Weekday header */}
      <View className="mt-4 flex-row">
        {WEEKDAY_LABELS.map((label, index) => (
          <Text
            key={`${label}-${index}`}
            className="flex-1 text-center text-[11px] font-semibold uppercase text-revive-muted dark:text-revive-muted-dark">
            {label}
          </Text>
        ))}
      </View>

      {/* Month grid */}
      <View className="mt-1">
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} className="flex-row">
            {week.map((date, dayIndex) => {
              if (!date) return <View key={dayIndex} className="m-0.5 aspect-square flex-1" />;
              const key = dateKey(date);
              return (
                <DayCell
                  key={dayIndex}
                  date={date}
                  record={recordsByDate.get(key)}
                  isToday={key === todayDateKey}
                  isFuture={date > today}
                  selected={key === selectedKey}
                  onPress={() => setSelectedKey((current) => (current === key ? null : key))}
                />
              );
            })}
          </View>
        ))}
      </View>

      {/* Day detail */}
      {selectedRecord && selectedDate && selectedMeta && (
        <Animated.View
          entering={FadeIn.duration(300)}
          className="mt-3 rounded-2xl p-4"
          style={{ backgroundColor: selectedMeta.chipColor }}>
          <Text className="text-xs font-bold uppercase tracking-wider" style={{ color: selectedMeta.color }}>
            {selectedDate.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <Text className="mt-1.5 text-sm text-revive-ink dark:text-revive-ink-dark">
            {selectedMeta.emoji} {selectedMeta.label}
            {selectedRecord.status === 'urge' && selectedRecord.urgeLevel
              ? `  ·  urge level ${selectedRecord.urgeLevel}/5`
              : ''}
            {selectedRecord.status === 'relapse'
              ? `  ·  ${selectedRecord.relapseCount}× today`
              : ''}
          </Text>
          {selectedTriggerLabel && (
            <Text className="mt-1.5 text-[13px] italic text-revive-muted dark:text-revive-muted-dark">
              Trigger: {selectedTriggerLabel}
            </Text>
          )}
        </Animated.View>
      )}

      <Text className="mt-4 text-center text-[13px] text-revive-muted dark:text-revive-muted-dark">
        Storms pass. Your roots stay deep.
      </Text>
    </Animated.View>
  );
}
