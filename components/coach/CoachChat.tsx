import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  ListRenderItem,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedKeyboard,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import ChevronDown from 'lucide-react-native/icons/chevron-down';

import ChatBubble from '@/components/coach/ChatBubble';
import ChatInput from '@/components/coach/ChatInput';
import MarkdownText from '@/components/coach/MarkdownText';
import TypingIndicator from '@/components/coach/TypingIndicator';
import VoiceRecorder from '@/components/coach/VoiceRecorder';
import { useReviveColors } from '@/components/dashboard/theme';
import { SPACING } from '@/constants/spacing';
import { useCoachChat } from '@/hooks/useCoach';
import { useSubscription } from '@/hooks/useSubscription';
import type { ChatMessage } from '@/stores/coachStore';
import type { QuickActionId } from '@/services/coachService';

type ListItem = ChatMessage | { id: 'streaming'; role: 'assistant'; content: string; createdAt: string };

type CoachChatProps = {
  conversationId: string;
  /** Set when arriving from a Quick Action chip — auto-sent once, on mount. */
  autoPrompt?: string;
  autoActionId?: QuickActionId;
};

/**
 * The chat screen itself — a full-screen stack route (not a tab), so the
 * floating bottom dock and its clearance math don't apply here at all.
 */
export default function CoachChat({ conversationId, autoPrompt, autoActionId }: CoachChatProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useReviveColors();
  const keyboard = useAnimatedKeyboard();
  const { isPro } = useSubscription();

  const {
    conversation,
    messages,
    sendMessage,
    stopGenerating,
    continueGenerating,
    regenerate,
    status,
    streamingText,
    stoppedMessageId,
    isGenerating,
  } = useCoachChat(conversationId);

  const [draft, setDraft] = useState('');
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const listRef = useRef<FlatList<ListItem>>(null);
  const hasAutoSent = useRef(false);

  const scrollToEnd = useCallback((animated = true) => {
    listRef.current?.scrollToEnd({ animated });
  }, []);

  // Every message-sending path (typed, voice, quick-action auto-send) funnels
  // through this single gate — free users can open the chat, scroll history,
  // and type, but the moment they try to actually send, the paywall shows.
  const guardedSend = useCallback(
    (text: string, actionId?: QuickActionId) => {
      if (!isPro) {
        router.push('/premium-paywall');
        return;
      }
      sendMessage(text, actionId);
    },
    [isPro, router, sendMessage],
  );

  useEffect(() => {
    if (autoPrompt && !hasAutoSent.current && messages.length === 0) {
      hasAutoSent.current = true;
      guardedSend(autoPrompt, autoActionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const sub = Keyboard.addListener(showEvent, () => scrollToEnd());
    return () => sub.remove();
  }, [scrollToEnd]);

  useEffect(() => {
    if (status !== 'idle') scrollToEnd();
  }, [status, scrollToEnd]);

  const items: ListItem[] =
    status !== 'idle'
      ? [...messages, { id: 'streaming', role: 'assistant', content: streamingText, createdAt: new Date().toISOString() }]
      : messages;

  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');

  const renderItem: ListRenderItem<ListItem> = useCallback(
    ({ item }) => {
      if (item.id === 'streaming') {
        return status === 'thinking' ? (
          <TypingIndicator />
        ) : (
          <View className="mb-1 max-w-[86%] items-start self-start">
            <View
              className="rounded-3xl rounded-bl-md bg-revive-card px-4 py-3 dark:bg-revive-card-dark"
              style={{ boxShadow: '0px 2px 10px rgba(26, 58, 44, 0.06)' }}>
              <MarkdownText
                content={item.content}
                className="text-[15px] leading-6 text-revive-ink dark:text-revive-ink-dark"
              />
            </View>
          </View>
        );
      }

      const isLastAssistant = item.role === 'assistant' && item.id === lastAssistantMessage?.id;
      return (
        <ChatBubble
          message={item}
          showRegenerate={isLastAssistant && !isGenerating}
          onRegenerate={() => regenerate(item.id)}
          showContinue={item.id === stoppedMessageId && !isGenerating}
          onContinue={() => continueGenerating(item.id)}
        />
      );
    },
    [status, lastAssistantMessage, isGenerating, regenerate, stoppedMessageId, continueGenerating],
  );

  // Full-screen stack route, not a tab — the floating dock never renders
  // here, so resting padding is just safe-area + a comfortable gap.
  const restingBottomPadding = insets.bottom + SPACING.md;
  const inputBarStyle = useAnimatedStyle(() => ({
    paddingBottom:
      keyboard.height.value > 0 ? keyboard.height.value + SPACING.sm : restingBottomPadding,
  }));

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-revive-bg dark:bg-revive-bg-dark">
      <View className="flex-row items-center border-b border-revive-mist px-4 py-3 dark:border-revive-mist-dark">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to Coach"
          onPress={() => router.back()}
          hitSlop={8}
          className="mr-2 h-9 w-9 items-center justify-center active:opacity-60">
          <ArrowLeft size={20} color={colors.ink} />
        </Pressable>
        <Text
          numberOfLines={1}
          className="flex-1 text-[16px] font-semibold text-revive-ink dark:text-revive-ink-dark">
          {conversation?.title ?? 'Coach'}
        </Text>
      </View>

      <View className="flex-1">
        <FlatList
          ref={listRef}
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: SPACING.xl,
            paddingTop: SPACING.lg,
            paddingBottom: SPACING.md,
          }}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          initialNumToRender={14}
          windowSize={9}
          maxToRenderPerBatch={10}
          onContentSizeChange={() => scrollToEnd()}
          onScroll={(e) => {
            const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
            const distanceFromBottom =
              contentSize.height - contentOffset.y - layoutMeasurement.height;
            setShowScrollToBottom(distanceFromBottom > 200);
          }}
          scrollEventThrottle={100}
        />

        {showScrollToBottom && (
          <Animated.View
            entering={FadeIn.duration(200)}
            style={{ position: 'absolute', bottom: 12, alignSelf: 'center' }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Scroll to latest message"
              onPress={() => scrollToEnd()}
              className="h-9 w-9 items-center justify-center rounded-full bg-revive-card active:opacity-80 dark:bg-revive-card-dark"
              style={{ boxShadow: '0px 4px 12px rgba(26, 58, 44, 0.14)' }}>
              <ChevronDown size={18} color={colors.primary} />
            </Pressable>
          </Animated.View>
        )}
      </View>

      <Animated.View style={inputBarStyle} className="px-4 pt-2">
        <ChatInput
          value={draft}
          onChangeText={setDraft}
          onSend={() => {
            guardedSend(draft);
            setDraft('');
          }}
          onStop={stopGenerating}
          onVoicePress={() => setVoiceOpen(true)}
          isGenerating={isGenerating}
        />
      </Animated.View>

      <VoiceRecorder
        visible={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        onSubmit={(text) => guardedSend(text)}
      />
    </SafeAreaView>
  );
}
