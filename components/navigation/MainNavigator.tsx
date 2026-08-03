import { StyleSheet, View } from 'react-native';

import CoachHome from '@/components/coach/CoachHome';
import CommunityScreen from '@/components/community/CommunityScreen';
import DashboardScreen from '@/components/dashboard/DashboardScreen';
import DraggableSupportBubble from '@/components/dashboard/DraggableSupportBubble';
import JourneyScreen from '@/components/journey/JourneyScreen';
import { MainNavigationProvider } from '@/components/navigation/NavigationContext';
import PremiumBottomBar from '@/components/navigation/PremiumBottomBar';
import SwipePager from '@/components/navigation/SwipePager';
import SettingsScreen from '@/components/settings/SettingsScreen';

/**
 * The entire post-auth app experience: five permanently-mounted screens
 * inside one swipeable pager, plus the floating dock and the persistent
 * support bubble. This is the single screen `app/(tabs)/index.tsx` renders —
 * there is no longer a per-tab Expo Router route underneath it. Tabs are
 * pager pages now, not routes, which is what makes state (scroll position,
 * chat history, draft text, keyboard focus) survive switching between them.
 */
export default function MainNavigator() {
  return (
    <MainNavigationProvider>
      <View style={StyleSheet.absoluteFill}>
        <SwipePager
          pages={[
            <DashboardScreen key="dashboard" />,
            <JourneyScreen key="journey" />,
            <CoachHome key="coach" />,
            <CommunityScreen key="community" />,
            <SettingsScreen key="settings" />,
          ]}
        />
        <PremiumBottomBar />
        <DraggableSupportBubble />
      </View>
    </MainNavigationProvider>
  );
}
