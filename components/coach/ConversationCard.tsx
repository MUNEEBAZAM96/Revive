import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, Layout } from 'react-native-reanimated';
import MoreVertical from 'lucide-react-native/icons/ellipsis-vertical';
import Pin from 'lucide-react-native/icons/pin';
import Pencil from 'lucide-react-native/icons/pencil';
import Trash2 from 'lucide-react-native/icons/trash-2';

import { useReviveColors } from '@/components/dashboard/theme';
import type { Conversation } from '@/stores/coachStore';

type ConversationCardProps = {
  conversation: Conversation;
  onPress: () => void;
  onTogglePin: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
  delay?: number;
};

function lastMessagePreview(conversation: Conversation): string {
  const last = conversation.messages[conversation.messages.length - 1];
  if (!last) return 'No messages yet';
  const oneLine = last.content.replace(/\s+/g, ' ').trim();
  return oneLine.length > 64 ? `${oneLine.slice(0, 64)}…` : oneLine;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Recent-conversation card with an inline overflow menu (pin / rename / delete). */
export default function ConversationCard({
  conversation,
  onPress,
  onTogglePin,
  onRename,
  onDelete,
  delay = 0,
}: ConversationCardProps) {
  const colors = useReviveColors();
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(conversation.title);

  const commitRename = () => {
    onRename(draftTitle);
    setRenaming(false);
    setMenuOpen(false);
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400)}
      layout={Layout.duration(200)}
      className="mb-3 rounded-3xl bg-revive-card p-4 dark:bg-revive-card-dark"
      style={{ boxShadow: '0px 4px 12px rgba(26, 58, 44, 0.06)' }}>
      <Pressable accessibilityRole="button" onPress={onPress} className="active:opacity-80">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 flex-row items-center pr-2">
            {conversation.pinned && (
              <Pin size={12} color={colors.primary} style={{ marginRight: 6 }} fill={colors.primary} />
            )}
            {renaming ? (
              <TextInput
                autoFocus
                value={draftTitle}
                onChangeText={setDraftTitle}
                onSubmitEditing={commitRename}
                onBlur={commitRename}
                className="flex-1 text-[15px] font-semibold text-revive-ink dark:text-revive-ink-dark"
                style={{ paddingVertical: 0 }}
              />
            ) : (
              <Text
                numberOfLines={1}
                className="flex-1 text-[15px] font-semibold text-revive-ink dark:text-revive-ink-dark">
                {conversation.title}
              </Text>
            )}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Conversation options"
            hitSlop={8}
            onPress={() => setMenuOpen((v) => !v)}
            className="active:opacity-60">
            <MoreVertical size={17} color={colors.muted} />
          </Pressable>
        </View>

        <Text
          numberOfLines={1}
          className="mt-1 text-[13px] text-revive-muted dark:text-revive-muted-dark">
          {lastMessagePreview(conversation)}
        </Text>
        <Text className="mt-1.5 text-[11px] text-revive-muted dark:text-revive-muted-dark">
          {relativeTime(conversation.updatedAt)}
        </Text>
      </Pressable>

      {menuOpen && (
        <Animated.View
          entering={FadeIn.duration(150)}
          className="mt-3 flex-row gap-2 border-t border-revive-mist pt-3 dark:border-revive-mist-dark">
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              onTogglePin();
              setMenuOpen(false);
            }}
            className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-revive-mist py-2.5 active:opacity-70 dark:bg-revive-mist-dark">
            <Pin size={14} color={colors.ink} />
            <Text className="text-[12px] font-medium text-revive-ink dark:text-revive-ink-dark">
              {conversation.pinned ? 'Unpin' : 'Pin'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setRenaming(true)}
            className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-revive-mist py-2.5 active:opacity-70 dark:bg-revive-mist-dark">
            <Pencil size={14} color={colors.ink} />
            <Text className="text-[12px] font-medium text-revive-ink dark:text-revive-ink-dark">
              Rename
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onDelete}
            className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-revive-mist py-2.5 active:opacity-70 dark:bg-revive-mist-dark">
            <Trash2 size={14} color="#D1567B" />
            <Text className="text-[12px] font-medium text-[#D1567B]">Delete</Text>
          </Pressable>
        </Animated.View>
      )}
    </Animated.View>
  );
}
