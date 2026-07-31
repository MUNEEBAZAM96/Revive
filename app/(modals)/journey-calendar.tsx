import { ScrollView } from 'react-native';

import JourneyCalendar from '@/components/dashboard/JourneyCalendar';

export default function JourneyCalendarScreen() {
  return (
    <ScrollView
      className="flex-1 bg-revive-bg dark:bg-revive-bg-dark"
      contentContainerClassName="p-5 pb-12"
      showsVerticalScrollIndicator={false}>
      <JourneyCalendar />
    </ScrollView>
  );
}
