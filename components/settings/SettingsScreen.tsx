import { useClerk, useUser } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SPACING } from '@/constants/spacing';
import { useBottomNavClearance } from '@/hooks/useBottomNavClearance';
import { useSubscription } from '@/hooks/useSubscription';
import { useAppStore } from '@/stores/appStore';

// Apple's and Google's own documented deep links into their subscription
// management screens — not app-specific, so there's nothing to configure.
const MANAGE_SUBSCRIPTION_URL =
  Platform.OS === 'ios'
    ? 'itms-apps://apps.apple.com/account/subscriptions'
    : 'https://play.google.com/store/account/subscriptions';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function SubscriptionSection() {
  const router = useRouter();
  const { isPro, planDetails, isTrialing, trialEndsAt, renewsAt, status, restore } = useSubscription();

  return (
    <View
      className="mt-4 rounded-3xl bg-revive-card p-5 dark:bg-revive-card-dark"
      style={{ boxShadow: '0px 4px 12px rgba(26, 58, 44, 0.06)' }}>
      <Text className="text-base font-bold text-revive-ink dark:text-revive-ink-dark">
        Subscription
      </Text>

      {isPro ? (
        <>
          <View className="mt-3 flex-row items-center justify-between">
            <Text className="text-[13px] text-revive-muted dark:text-revive-muted-dark">Current Plan</Text>
            <Text className="text-[13px] font-semibold capitalize text-revive-ink dark:text-revive-ink-dark">
              Revive Pro · {planDetails?.id ?? '—'}
            </Text>
          </View>
          <View className="mt-2 flex-row items-center justify-between">
            <Text className="text-[13px] text-revive-muted dark:text-revive-muted-dark">
              {isTrialing ? 'Trial ends' : 'Renews'}
            </Text>
            <Text className="text-[13px] font-semibold text-revive-ink dark:text-revive-ink-dark">
              {isTrialing && trialEndsAt
                ? formatDate(trialEndsAt)
                : renewsAt
                  ? formatDate(renewsAt)
                  : '—'}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => Linking.openURL(MANAGE_SUBSCRIPTION_URL)}
            className="mt-4 items-center rounded-2xl bg-revive-mist py-3 active:opacity-80 dark:bg-revive-mist-dark">
            <Text className="text-[14px] font-semibold text-revive-ink dark:text-revive-ink-dark">
              Manage Subscription
            </Text>
          </Pressable>
          {planDetails?.id === 'monthly' && (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/premium-paywall')}
              className="mt-2.5 items-center rounded-2xl border border-revive-primary py-3 active:opacity-80 dark:border-revive-primary-dark">
              <Text className="text-[14px] font-semibold text-revive-primary dark:text-revive-primary-dark">
                Upgrade to Yearly
              </Text>
            </Pressable>
          )}
        </>
      ) : (
        <>
          <Text className="mt-1.5 text-[14px] leading-5 text-revive-muted dark:text-revive-muted-dark">
            You're on the free tier. Upgrade to unlock the AI Recovery Coach.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/premium-paywall')}
            className="mt-4 items-center rounded-2xl bg-revive-primary py-3 active:opacity-85 dark:bg-revive-primary-dark">
            <Text className="text-[14px] font-semibold text-white dark:text-revive-bg-dark">
              Unlock Revive Pro
            </Text>
          </Pressable>
        </>
      )}

      <Pressable
        accessibilityRole="button"
        disabled={status !== 'idle'}
        onPress={() => restore()}
        className="mt-2.5 items-center py-2 active:opacity-70">
        <Text className="text-[13px] font-medium text-revive-muted dark:text-revive-muted-dark">
          {status === 'restoring' ? 'Restoring…' : 'Restore Purchases'}
        </Text>
      </Pressable>
    </View>
  );
}

/**
 * Lives under components/settings/ (not app/(tabs)/) because it's now a page
 * inside SwipePager rather than its own Expo Router route — see
 * components/navigation/MainNavigator.tsx.
 */
export default function SettingsScreen() {
  const router = useRouter();
  const bottomClearance = useBottomNavClearance();
  const { signOut } = useClerk();
  const { user } = useUser();
  const setOnboardingComplete = useAppStore((state) => state.setOnboardingComplete);
  const logout = useAppStore((state) => state.logout);
  const [signingOut, setSigningOut] = useState(false);
  const { isPro, purchase, debugDowngrade } = useSubscription();

  const handleResetOnboarding = () => {
    setOnboardingComplete(false);
    router.replace('/');
  };

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await signOut();
      logout(); // Reset local Zustand state
      router.replace('/');
    } catch (err) {
      Alert.alert('Sign out failed', 'Please try again.');
      console.error('Sign out error:', err);
    } finally {
      setSigningOut(false);
    }
  };

  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const userName = user?.firstName ?? userEmail?.split('@')[0] ?? 'User';

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-revive-bg dark:bg-revive-bg-dark">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: SPACING.xl,
          paddingTop: SPACING.lg,
          paddingBottom: bottomClearance,
        }}>
        <Text className="text-[26px] font-bold text-revive-ink dark:text-revive-ink-dark">
          Settings
        </Text>

        <View
          className="mt-5 rounded-3xl bg-revive-card p-5 dark:bg-revive-card-dark"
          style={{ boxShadow: '0px 4px 12px rgba(26, 58, 44, 0.06)' }}>
          <Text className="text-base font-bold text-revive-ink dark:text-revive-ink-dark">
            Profile
          </Text>
          <Text className="mt-1.5 text-[14px] leading-5 text-revive-muted dark:text-revive-muted-dark">
            {userName}
            {userEmail ? ` · ${userEmail}` : ''}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={handleLogout}
            disabled={signingOut}
            className="mt-4 items-center rounded-2xl border border-[#D1567B] py-3 active:opacity-80"
            style={signingOut ? { opacity: 0.6 } : undefined}>
            {signingOut ? (
              <ActivityIndicator size="small" color="#D1567B" />
            ) : (
              <Text className="text-[15px] font-semibold text-[#D1567B]">Log out</Text>
            )}
          </Pressable>
        </View>

        <SubscriptionSection />

        <View
          className="mt-4 rounded-3xl bg-[#F4D98C1A] p-5"
          style={{ boxShadow: '0px 4px 12px rgba(26, 58, 44, 0.06)' }}>
          <Text className="text-base font-bold text-revive-ink dark:text-revive-ink-dark">
            🛠 Debug (remove before release)
          </Text>
          <Text className="mt-1.5 text-[14px] leading-5 text-revive-muted dark:text-revive-muted-dark">
            Shortcuts for testing navigation state transitions.
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={handleResetOnboarding}
            className="mt-3 items-center rounded-2xl bg-revive-card py-3 active:opacity-80 dark:bg-revive-card-dark">
            <Text className="text-[15px] font-medium text-revive-ink dark:text-revive-ink-dark">
              Reset Onboarding
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(modals)/crisis-resources')}
            className="mt-2.5 items-center rounded-2xl bg-revive-card py-3 active:opacity-80 dark:bg-revive-card-dark">
            <Text className="text-[15px] font-medium text-revive-ink dark:text-revive-ink-dark">
              Simulate Crisis Signal
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(modals)/daily-check-in')}
            className="mt-2.5 items-center rounded-2xl bg-revive-card py-3 active:opacity-80 dark:bg-revive-card-dark">
            <Text className="text-[15px] font-medium text-revive-ink dark:text-revive-ink-dark">
              Open Daily Check-in
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => purchase('yearly')}
            className="mt-2.5 items-center rounded-2xl bg-revive-card py-3 active:opacity-80 dark:bg-revive-card-dark">
            <Text className="text-[15px] font-medium text-revive-ink dark:text-revive-ink-dark">
              Simulate Pro Purchase
            </Text>
          </Pressable>
          {isPro && (
            <Pressable
              accessibilityRole="button"
              onPress={debugDowngrade}
              className="mt-2.5 items-center rounded-2xl bg-revive-card py-3 active:opacity-80 dark:bg-revive-card-dark">
              <Text className="text-[15px] font-medium text-revive-ink dark:text-revive-ink-dark">
                Downgrade to Free
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
