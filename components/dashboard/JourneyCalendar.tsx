import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import {
  DayRecord,
  dateKey,
  gardenSummary,
  monthStats,
  recordFor,
} from './gardenData';

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
  record: DayRecord | undefined;
  isToday: boolean;
  isFuture: boolean;
  selected: boolean;
  onPress: () => void;
}) {
  const background = record
    ? record.status === 'storm'
      ? 'bg-revive-storm-chip dark:bg-revive-storm-chip-dark'
      : 'bg-revive-mist dark:bg-revive-mist-dark'
    : 'bg-transparent';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      disabled={!record}
      onPress={onPress}
      className={`m-0.5 aspect-square flex-1 items-center justify-center rounded-xl ${background} ${
        selected ? 'border-2 border-revive-primary dark:border-revive-primary-dark' : ''
      } ${isToday ? 'border-2 border-revive-secondary' : ''}`}>
      <Text
        className={`text-[10px] ${
          isFuture
            ? 'text-revive-muted/40 dark:text-revive-muted-dark/40'
            : record?.status === 'storm'
              ? 'text-revive-storm dark:text-revive-storm-dark'
              : 'text-revive-muted dark:text-revive-muted-dark'
        }`}>
        {date.getDate()}
      </Text>
      {record && <Text className="text-[13px]">{record.status === 'storm' ? '⛈️' : '🌿'}</Text>}
      {record?.checkedIn && (
        <View
          className={`absolute bottom-1 h-1 w-1 rounded-full ${
            record.status === 'storm'
              ? 'bg-revive-storm dark:bg-revive-storm-dark'
              : 'bg-revive-primary dark:bg-revive-primary-dark'
          }`}
        />
      )}
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
 * Month view of the recovery journey: 🌿 growth days, ⛈️ storm days, a small
 * dot for check-ins. Deliberately no red and no failure framing anywhere.
 */
export default function JourneyCalendar() {
  const today = new Date();
  const todayKey = dateKey(today);
  const [viewed, setViewed] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const year = viewed.getFullYear();
  const month = viewed.getMonth();
  const weeks = useMemo(() => weeksOf(year, month), [year, month]);
  const stats = useMemo(() => monthStats(year, month), [year, month]);

  const monthLabel = viewed.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const selectedRecord = selectedKey ? recordFor(selectedKey) : undefined;
  const selectedDate = selectedKey ? new Date(`${selectedKey}T12:00:00`) : null;

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
        <Stat value={stats.growthDays} label="Growth days" />
        <Stat value={stats.checkIns} label="Check-ins" />
        <Stat value={gardenSummary.longestJourney} label="Longest journey" />
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
                  record={recordFor(key)}
                  isToday={key === todayKey}
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
      {selectedRecord && selectedDate && (
        <Animated.View
          entering={FadeIn.duration(300)}
          className={`mt-3 rounded-2xl p-4 ${
            selectedRecord.status === 'storm'
              ? 'bg-revive-storm-chip dark:bg-revive-storm-chip-dark'
              : 'bg-revive-mist dark:bg-revive-mist-dark'
          }`}>
          <Text
            className={`text-xs font-bold uppercase tracking-wider ${
              selectedRecord.status === 'storm'
                ? 'text-revive-storm dark:text-revive-storm-dark'
                : 'text-revive-primary dark:text-revive-primary-dark'
            }`}>
            {selectedDate.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <Text className="mt-1.5 text-sm text-revive-ink dark:text-revive-ink-dark">
            {selectedRecord.status === 'storm' ? '⛈️ A storm passed' : '🌿 A day of growth'}
            {selectedRecord.mood ? `  ·  mood ${selectedRecord.mood}` : ''}
            {selectedRecord.checkedIn ? '  ·  💧 checked in' : ''}
          </Text>
          {selectedRecord.note && (
            <Text className="mt-1.5 text-[13px] italic text-revive-muted dark:text-revive-muted-dark">
              &ldquo;{selectedRecord.note}&rdquo;
            </Text>
          )}
          {selectedRecord.weatheredStorm && (
            <View className="mt-2 self-start rounded-full bg-revive-card px-3 py-1 dark:bg-revive-card-dark">
              <Text className="text-xs font-semibold text-revive-primary dark:text-revive-primary-dark">
                🛡️ Weathered the storm
              </Text>
            </View>
          )}
        </Animated.View>
      )}

      <Text className="mt-4 text-center text-[13px] text-revive-muted dark:text-revive-muted-dark">
        Storms pass. Your roots stay deep.
      </Text>
    </Animated.View>
  );
}
