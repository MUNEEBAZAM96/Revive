import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Lock from 'lucide-react-native/icons/lock';
import Plus from 'lucide-react-native/icons/plus';
import Search from 'lucide-react-native/icons/search';
import Sparkles from 'lucide-react-native/icons/sparkles';

import ConversationCard from '@/components/coach/ConversationCard';
import QuickActions from '@/components/coach/QuickActions';
import { useReviveColors } from '@/components/dashboard/theme';
import { useBottomNavClearance } from '@/hooks/useBottomNavClearance';
import { useCoachConversations } from '@/hooks/useCoach';
import { useSubscription } from '@/hooks/useSubscription';
import type { QuickAction } from '@/services/coachService';
import { useGrowthStore } from '@/stores/growthStore';

const TODAYS_INSIGHT =
  'I noticed evenings are usually your difficult time. Would you like to prepare a plan for tonight?';

// Same "no real auth/profile name" situation as the Dashboard — mirrors its
// local MOCK_NAME convention rather than inventing a shared constant for a
// single hardcoded value used in two places.
const MOCK_NAME = 'Muneeb';

function greetingForNow(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

/** Two slow-drifting translucent blobs behind the greeting — a calm, premium "AI presence" rather than a literal illustration. */
function AmbientBackground() {
  const colors = useReviveColors();
  const driftA = useSharedValue(0);
  const driftB = useSharedValue(0);

  useEffect(() => {
    driftA.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 6000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
    driftB.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 7200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 7200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const styleA = useAnimatedStyle(() => ({
    transform: [
      { translateX: driftA.value * 18 },
      { translateY: driftA.value * -12 },
      { scale: 1 + driftA.value * 0.08 },
    ],
  }));
  const styleB = useAnimatedStyle(() => ({
    transform: [
      { translateX: driftB.value * -16 },
      { translateY: driftB.value * 14 },
      { scale: 1 + driftB.value * 0.06 },
    ],
  }));

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      <Animated.View
        style={[
          styleA,
          {
            position: 'absolute',
            top: -40,
            right: -30,
            width: 160,
            height: 160,
            borderRadius: 999,
            backgroundColor: colors.primary,
            opacity: 0.16,
          },
        ]}
      />
      <Animated.View
        style={[
          styleB,
          {
            position: 'absolute',
            bottom: -50,
            left: -30,
            width: 180,
            height: 180,
            borderRadius: 999,
            backgroundColor: colors.secondary,
            opacity: 0.18,
          },
        ]}
      />
    </View>
  );
}

/** Compact, expandable daily insight — keeps the `read_insight` mission's hook without dominating the redesigned home. */
function TodaysInsightCard({ delay }: { delay: number }) {
  const [expanded, setExpanded] = useState(false);
  const completeMission = useGrowthStore((s) => s.completeMission);
  const insightRead = useGrowthStore((s) => s.dailyMissions.completed.read_insight === true);

  const toggle = () => {
    if (!expanded) completeMission('read_insight');
    setExpanded((v) => !v);
  };

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(450)} className="px-5">
      <Pressable
        accessibilityRole="button"
        onPress={toggle}
        className="rounded-2xl bg-revive-mist px-4 py-3 active:opacity-80 dark:bg-revive-mist-dark">
        <View className="flex-row items-center">
          <Text className="text-base">🌿</Text>
          <Text className="ml-2 flex-1 text-[13px] font-medium text-revive-ink dark:text-revive-ink-dark">
            Today&apos;s Insight {insightRead ? '· read ✓' : ''}
          </Text>
          <Text className="text-revive-muted dark:text-revive-muted-dark">{expanded ? '▲' : '▼'}</Text>
        </View>
        {expanded && (
          <Animated.View entering={FadeInDown.duration(200)}>
            <Text className="mt-2.5 text-[13px] leading-5 text-revive-muted dark:text-revive-muted-dark">
              {TODAYS_INSIGHT}
            </Text>
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
}

/** Free-tier upsell — the "quick explanation + benefits" preview the paywall spec calls for, right on the landing screen. */
function UnlockProCard({ delay }: { delay: number }) {
  const router = useRouter();
  const colors = useReviveColors();

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(500)} className="px-5">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Unlock Revive Pro"
        onPress={() => router.push('/premium-paywall')}
        className="flex-row items-center rounded-3xl bg-revive-mist px-4 py-4 active:opacity-85 dark:bg-revive-mist-dark">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-revive-card dark:bg-revive-card-dark">
          <Lock size={16} color={colors.primary} />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-[14px] font-semibold text-revive-ink dark:text-revive-ink-dark">
            Unlock Revive Pro
          </Text>
          <Text className="mt-0.5 text-[12px] leading-4 text-revive-muted dark:text-revive-muted-dark">
            Unlimited conversations, personalized coaching, and trigger analysis.
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/** A static, non-interactive taste of the chat experience for free users — the "sample conversation" preview from the spec. */
function SampleConversationPreview({ delay }: { delay: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(500)} className="px-5">
      <Text className="mb-3 text-[16px] font-semibold text-revive-ink dark:text-revive-ink-dark">
        A taste of the conversation
      </Text>
      <View
        className="rounded-3xl bg-revive-card p-4 dark:bg-revive-card-dark"
        style={{ boxShadow: '0px 4px 12px rgba(26, 58, 44, 0.06)' }}>
        <View className="max-w-[82%] self-end rounded-3xl rounded-br-md bg-revive-primary px-4 py-2.5 dark:bg-revive-primary-dark">
          <Text className="text-[14px] leading-5 text-white dark:text-revive-bg-dark">
            I have an urge right now.
          </Text>
        </View>
        <View className="mt-2.5 max-w-[86%] self-start rounded-3xl rounded-bl-md bg-revive-mist px-4 py-2.5 dark:bg-revive-mist-dark">
          <Text className="text-[14px] leading-5 text-revive-ink dark:text-revive-ink-dark">
            I hear you. An urge is a wave — it rises, peaks, and passes, usually inside 20
            minutes. Right now, try naming it out loud and taking 5 slow breaths…
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

/**
 * The Coach landing screen — never a blank chat. Personalized greeting,
 * quick recovery actions, and recent conversations, all inside one scroll
 * view built with the app's existing SPACING/theme conventions.
 */
export default function CoachHome() {
  const router = useRouter();
  const colors = useReviveColors();
  const bottomClearance = useBottomNavClearance();
  const { isPro } = useSubscription();
  const {
    conversations,
    hasAnyConversations,
    query,
    setQuery,
    createConversation,
    deleteConversation,
    renameConversation,
    togglePin,
  } = useCoachConversations();

  const openConversation = (conversationId: string) => {
    router.push({ pathname: '/coach-chat', params: { conversationId } });
  };

  const startNewConversation = () => {
    const id = createConversation();
    router.push({ pathname: '/coach-chat', params: { conversationId: id } });
  };

  const startFromQuickAction = (action: QuickAction) => {
    // Quick actions immediately send a message, so free users hit the
    // paywall right here instead of bouncing through an empty chat first.
    if (!isPro) {
      router.push('/premium-paywall');
      return;
    }
    const id = createConversation();
    router.push({
      pathname: '/coach-chat',
      params: { conversationId: id, actionId: action.id, prompt: action.prompt },
    });
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-revive-bg dark:bg-revive-bg-dark">
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: bottomClearance }}>
        <View className="px-5 pt-2">
          <Animated.View entering={FadeInDown.duration(500)} className="flex-row items-center justify-between">
            <View>
              <Text className="text-[22px] font-bold text-revive-ink dark:text-revive-ink-dark">
                AI Recovery Coach
              </Text>
              <Text className="mt-0.5 text-[13px] text-revive-muted dark:text-revive-muted-dark">
                Your private AI companion.
              </Text>
            </View>
            <View className="h-11 w-11 items-center justify-center rounded-full bg-revive-mist dark:bg-revive-mist-dark">
              <Sparkles size={18} color={colors.primary} />
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(80).duration(550)}
            className="mt-5 overflow-hidden rounded-[28px] bg-revive-card p-6 dark:bg-revive-card-dark"
            style={{ boxShadow: '0px 6px 20px rgba(26, 58, 44, 0.08)' }}>
            <AmbientBackground />
            <Text className="text-[24px] font-bold text-revive-ink dark:text-revive-ink-dark">
              {greetingForNow()}
            </Text>
            <Text className="text-[24px] font-bold text-revive-primary dark:text-revive-primary-dark">
              {MOCK_NAME}
            </Text>
            <Text className="mt-2 text-[14px] leading-5 text-revive-muted dark:text-revive-muted-dark">
              I'm here whenever you need guidance.
            </Text>
          </Animated.View>
        </View>

        {!isPro && (
          <View className="mt-4">
            <UnlockProCard delay={120} />
          </View>
        )}

        <View className="mt-4">
          <TodaysInsightCard delay={140} />
        </View>

        <View className="mt-6 px-5">
          <Text className="mb-3 text-[16px] font-semibold text-revive-ink dark:text-revive-ink-dark">
            Quick Recovery Actions
          </Text>
        </View>
        <View className="pl-5">
          <QuickActions onSelect={startFromQuickAction} delay={160} />
        </View>

        {!isPro && (
          <View className="mt-7">
            <SampleConversationPreview delay={200} />
          </View>
        )}

        <View className="mt-8 px-5">
          <View className="flex-row items-center justify-between">
            <Text className="text-[16px] font-semibold text-revive-ink dark:text-revive-ink-dark">
              Recent Conversations
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Start a new conversation"
              onPress={startNewConversation}
              className="h-8 w-8 items-center justify-center rounded-full bg-revive-mist active:opacity-70 dark:bg-revive-mist-dark">
              <Plus size={16} color={colors.primary} />
            </Pressable>
          </View>

          {hasAnyConversations && (
            <View className="mt-3 flex-row items-center rounded-2xl bg-revive-mist px-3.5 dark:bg-revive-mist-dark">
              <Search size={15} color={colors.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search conversations"
                placeholderTextColor={colors.muted}
                className="ml-2 flex-1 py-2.5 text-[14px] text-revive-ink dark:text-revive-ink-dark"
              />
            </View>
          )}

          <View className="mt-4">
            {conversations.length === 0 ? (
              <Animated.View entering={FadeInDown.delay(220).duration(450)} className="items-center py-6">
                <Text className="text-[13px] text-revive-muted dark:text-revive-muted-dark">
                  {hasAnyConversations
                    ? 'No conversations match your search.'
                    : 'No conversations yet — try a quick action above, or start a new chat.'}
                </Text>
              </Animated.View>
            ) : (
              conversations.map((conversation, index) => (
                <ConversationCard
                  key={conversation.id}
                  conversation={conversation}
                  delay={200 + index * 40}
                  onPress={() => openConversation(conversation.id)}
                  onTogglePin={() => togglePin(conversation.id)}
                  onRename={(title) => renameConversation(conversation.id, title)}
                  onDelete={() => deleteConversation(conversation.id)}
                />
              ))
            )}
          </View>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
