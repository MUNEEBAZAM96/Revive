import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

/**
 * Conversation history — persisted locally (AsyncStorage). Deliberately only
 * holds finished messages: mid-stream text lives in the chat screen's own
 * local state (see hooks/useCoach.ts) and is committed here once a reply
 * completes, is stopped, or is regenerated. Streaming word-by-word into a
 * persisted store would serialize the entire conversation list to storage on
 * every token — cheap-looking but wasteful at scale, and unnecessary since
 * nothing needs that intermediate text to survive a reload.
 */
interface CoachState {
  conversations: Conversation[];

  /** Creates an empty conversation and returns its id. */
  createConversation: () => string;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  togglePin: (id: string) => void;

  addMessage: (conversationId: string, message: ChatMessage) => void;
  appendToMessage: (conversationId: string, messageId: string, extraText: string) => void;
  removeMessage: (conversationId: string, messageId: string) => void;
  /** Removes every message from `messageId` onward — used before regenerating. */
  truncateFrom: (conversationId: string, messageId: string) => void;
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useCoachStore = create<CoachState>()(
  persist(
    (set) => ({
      conversations: [],

      createConversation: () => {
        const id = newId();
        const now = new Date().toISOString();
        const conversation: Conversation = {
          id,
          title: 'New Conversation',
          pinned: false,
          createdAt: now,
          updatedAt: now,
          messages: [],
        };
        set((state) => ({ conversations: [conversation, ...state.conversations] }));
        return id;
      },

      deleteConversation: (id) => {
        set((state) => ({ conversations: state.conversations.filter((c) => c.id !== id) }));
      },

      renameConversation: (id, title) => {
        const trimmed = title.trim();
        if (!trimmed) return;
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, title: trimmed, updatedAt: new Date().toISOString() } : c,
          ),
        }));
      },

      togglePin: (id) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, pinned: !c.pinned } : c,
          ),
        }));
      },

      addMessage: (conversationId, message) => {
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            const isFirstUserMessage =
              message.role === 'user' && !c.messages.some((m) => m.role === 'user');
            return {
              ...c,
              messages: [...c.messages, message],
              updatedAt: message.createdAt,
              title: isFirstUserMessage ? titleFromMessage(message.content) : c.title,
            };
          }),
        }));
      },

      appendToMessage: (conversationId, messageId, extraText) => {
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            return {
              ...c,
              updatedAt: new Date().toISOString(),
              messages: c.messages.map((m) =>
                m.id === messageId ? { ...m, content: m.content + extraText } : m,
              ),
            };
          }),
        }));
      },

      removeMessage: (conversationId, messageId) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, messages: c.messages.filter((m) => m.id !== messageId) }
              : c,
          ),
        }));
      },

      truncateFrom: (conversationId, messageId) => {
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            const cutIndex = c.messages.findIndex((m) => m.id === messageId);
            if (cutIndex === -1) return c;
            return { ...c, messages: c.messages.slice(0, cutIndex) };
          }),
        }));
      },
    }),
    {
      name: 'revive.coach.v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

function titleFromMessage(content: string): string {
  const oneLine = content.replace(/\s+/g, ' ').trim();
  return oneLine.length > 42 ? `${oneLine.slice(0, 42)}…` : oneLine || 'New Conversation';
}
