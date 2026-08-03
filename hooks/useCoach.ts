import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { buildCoachContext } from '@/services/coachContext';
import {
  createCancelToken,
  streamCoachContinuation,
  streamCoachReply,
  type CancelToken,
  type QuickActionId,
} from '@/services/coachService';
import { useAppStore } from '@/stores/appStore';
import { type ChatMessage, type Conversation, useCoachStore } from '@/stores/coachStore';
import { useGrowthStore } from '@/stores/growthStore';
import { useRecoveryCheckIn } from '@/hooks/useRecoveryCheckIn';

function newMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Pulls the small, structured signal set the coach's replies are grounded in. Recomputed on every call — cheap, and always current. */
function useCoachContextSnapshot() {
  const { checkIns, currentStreak, recoveryScore, hasCheckedInToday } = useRecoveryCheckIn();
  const reviveScore = useGrowthStore((s) => s.reviveScore);
  const level = useGrowthStore((s) => s.level);
  const diamonds = useGrowthStore((s) => s.diamonds);
  const longestStreak = useGrowthStore((s) => s.longestStreak);
  const todaysPlaylist = useGrowthStore((s) => s.todaysPlaylist);
  const achievementsUnlocked = useGrowthStore((s) => s.unlockedAchievements.length);
  const primaryGoal = useAppStore((s) => s.profile.primaryGoal);
  const focusAreas = useAppStore((s) => s.profile.focusAreas);

  return useMemo(
    () =>
      buildCoachContext({
        checkIns,
        currentStreak,
        longestStreak,
        recoveryScore,
        hasCheckedInToday,
        reviveScore,
        level,
        diamonds,
        gamesCompletedToday: todaysPlaylist.games.filter((g) => g.completed).length,
        gamesTotalToday: todaysPlaylist.games.length,
        achievementsUnlocked,
        primaryGoal,
        focusAreas,
      }),
    [
      checkIns,
      currentStreak,
      longestStreak,
      recoveryScore,
      hasCheckedInToday,
      reviveScore,
      level,
      diamonds,
      todaysPlaylist,
      achievementsUnlocked,
      primaryGoal,
      focusAreas,
    ],
  );
}

/** For the Coach home screen: browsing, searching, and managing conversations. */
export function useCoachConversations() {
  const conversations = useCoachStore((s) => s.conversations);
  const createConversation = useCoachStore((s) => s.createConversation);
  const deleteConversation = useCoachStore((s) => s.deleteConversation);
  const renameConversation = useCoachStore((s) => s.renameConversation);
  const togglePin = useCoachStore((s) => s.togglePin);
  const [query, setQuery] = useState('');

  const sorted = useMemo(() => {
    const byRecency = [...conversations].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    const pinned = byRecency.filter((c) => c.pinned);
    const rest = byRecency.filter((c) => !c.pinned);
    return [...pinned, ...rest];
  }, [conversations]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q)),
    );
  }, [sorted, query]);

  return {
    conversations: filtered,
    hasAnyConversations: conversations.length > 0,
    query,
    setQuery,
    createConversation,
    deleteConversation,
    renameConversation,
    togglePin,
  };
}

export type GenerationStatus = 'idle' | 'thinking' | 'streaming';

/** For the chat screen: a single conversation's messages plus live streaming state. */
export function useCoachChat(conversationId: string | null) {
  const conversation = useCoachStore((s) =>
    conversationId ? s.conversations.find((c) => c.id === conversationId) : undefined,
  );
  const addMessage = useCoachStore((s) => s.addMessage);
  const appendToMessage = useCoachStore((s) => s.appendToMessage);
  const removeMessage = useCoachStore((s) => s.removeMessage);
  const truncateFrom = useCoachStore((s) => s.truncateFrom);
  const completeMission = useGrowthStore((s) => s.completeMission);
  const context = useCoachContextSnapshot();

  const [streamingText, setStreamingText] = useState('');
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [stoppedMessageId, setStoppedMessageId] = useState<string | null>(null);
  const cancelRef = useRef<CancelToken | null>(null);

  useEffect(() => {
    // Leaving mid-reply cancels it — this is a local mock, not a server job
    // that should keep running unattended.
    return () => {
      if (cancelRef.current) cancelRef.current.cancelled = true;
    };
  }, [conversationId]);

  const runGeneration = useCallback(
    async (userText: string, actionId?: QuickActionId) => {
      if (!conversationId) return;
      const cancel = createCancelToken();
      cancelRef.current = cancel;
      setStatus('thinking');
      setStreamingText('');

      let accumulated = '';
      for await (const token of streamCoachReply(userText, context, cancel, actionId)) {
        if (cancel.cancelled) break;
        accumulated += token;
        setStatus('streaming');
        setStreamingText(accumulated);
      }

      cancelRef.current = null;
      setStatus('idle');
      setStreamingText('');

      const finalText = accumulated.trim();
      if (finalText.length > 0) {
        addMessage(conversationId, {
          id: newMessageId(),
          role: 'assistant',
          content: finalText,
          createdAt: new Date().toISOString(),
        });
      }
    },
    [conversationId, context, addMessage],
  );

  const sendMessage = useCallback(
    (text: string, actionId?: QuickActionId) => {
      const trimmed = text.trim();
      if (!trimmed || !conversationId || status !== 'idle') return;

      setStoppedMessageId(null);
      addMessage(conversationId, {
        id: newMessageId(),
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
      });
      completeMission('talk_with_coach');

      void runGeneration(trimmed, actionId);
    },
    [conversationId, status, addMessage, completeMission, runGeneration],
  );

  const stopGenerating = useCallback(() => {
    if (cancelRef.current) cancelRef.current.cancelled = true;
    setStatus('idle');
    // Keep whatever text streamed in so far as the final assistant message,
    // rather than discarding it — matches "Stop Generating" behavior users
    // expect from ChatGPT/Claude. Remembering its id lets "Continue" resume it.
    setStreamingText((current) => {
      const finalText = current.trim();
      if (finalText.length > 0 && conversationId) {
        const id = newMessageId();
        addMessage(conversationId, {
          id,
          role: 'assistant',
          content: finalText,
          createdAt: new Date().toISOString(),
        });
        setStoppedMessageId(id);
      }
      return '';
    });
  }, [conversationId, addMessage]);

  const continueGenerating = useCallback(
    async (assistantMessageId: string) => {
      if (!conversationId || status !== 'idle') return;
      const cancel = createCancelToken();
      cancelRef.current = cancel;
      setStatus('thinking');

      let accumulated = '';
      for await (const token of streamCoachContinuation(context, cancel)) {
        if (cancel.cancelled) break;
        accumulated += token;
        setStatus('streaming');
      }

      cancelRef.current = null;
      setStatus('idle');
      if (accumulated.trim().length > 0) {
        appendToMessage(conversationId, assistantMessageId, accumulated);
      }
      setStoppedMessageId(null);
    },
    [conversationId, status, context, appendToMessage],
  );

  const regenerate = useCallback(
    (assistantMessageId: string) => {
      if (!conversationId || !conversation || status !== 'idle') return;
      const index = conversation.messages.findIndex((m) => m.id === assistantMessageId);
      if (index <= 0) return;
      const precedingUser = conversation.messages[index - 1];
      if (precedingUser.role !== 'user') return;

      truncateFrom(conversationId, assistantMessageId);
      void runGeneration(precedingUser.content);
    },
    [conversationId, conversation, status, truncateFrom, runGeneration],
  );

  const deleteMessage = useCallback(
    (messageId: string) => {
      if (!conversationId) return;
      removeMessage(conversationId, messageId);
    },
    [conversationId, removeMessage],
  );

  const messages: ChatMessage[] = conversation?.messages ?? [];

  return {
    conversation: conversation as Conversation | undefined,
    messages,
    sendMessage,
    stopGenerating,
    continueGenerating,
    regenerate,
    deleteMessage,
    status,
    streamingText,
    stoppedMessageId,
    isGenerating: status !== 'idle',
  };
}
