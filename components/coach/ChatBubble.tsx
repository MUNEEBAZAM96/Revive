import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { memo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Copy from 'lucide-react-native/icons/copy';
import Check from 'lucide-react-native/icons/check';
import RefreshCw from 'lucide-react-native/icons/refresh-cw';
import ChevronsDown from 'lucide-react-native/icons/chevrons-down';

import MarkdownText from '@/components/coach/MarkdownText';
import { useReviveColors } from '@/components/dashboard/theme';
import type { ChatMessage } from '@/stores/coachStore';

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

type ChatBubbleProps = {
  message: ChatMessage;
  showRegenerate?: boolean;
  onRegenerate?: () => void;
  showContinue?: boolean;
  onContinue?: () => void;
  hideFooter?: boolean;
};

function ChatBubble({
  message,
  showRegenerate,
  onRegenerate,
  showContinue,
  onContinue,
  hideFooter,
}: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const colors = useReviveColors();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await Clipboard.setStringAsync(message.content);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(280).springify().damping(18)}
      className={`mb-1 max-w-[86%] ${isUser ? 'self-end items-end' : 'self-start items-start'}`}>
      <View
        className={`rounded-3xl px-4 py-3 ${
          isUser
            ? 'rounded-br-md bg-revive-primary dark:bg-revive-primary-dark'
            : 'rounded-bl-md bg-revive-card dark:bg-revive-card-dark'
        }`}
        style={!isUser ? { boxShadow: '0px 2px 10px rgba(26, 58, 44, 0.06)' } : undefined}>
        {isUser ? (
          <Text className="text-[15px] leading-6 text-white dark:text-revive-bg-dark">
            {message.content}
          </Text>
        ) : (
          <MarkdownText
            content={message.content}
            className="text-[15px] leading-6 text-revive-ink dark:text-revive-ink-dark"
          />
        )}
      </View>

      {!hideFooter && (
      <View className="mt-1 flex-row items-center gap-3 px-1">
        <Text className="text-[11px] text-revive-muted dark:text-revive-muted-dark">
          {formatTime(message.createdAt)}
        </Text>

        {!isUser && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Copy message"
            onPress={copy}
            hitSlop={8}
            className="active:opacity-60">
            {copied ? (
              <Check size={13} color={colors.primary} />
            ) : (
              <Copy size={13} color={colors.muted} />
            )}
          </Pressable>
        )}

        {!isUser && showRegenerate && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Regenerate response"
            onPress={onRegenerate}
            hitSlop={8}
            className="active:opacity-60">
            <RefreshCw size={13} color={colors.muted} />
          </Pressable>
        )}

        {!isUser && showContinue && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue generating"
            onPress={onContinue}
            hitSlop={8}
            className="active:opacity-60">
            <ChevronsDown size={13} color={colors.muted} />
          </Pressable>
        )}
      </View>
      )}
    </Animated.View>
  );
}

export default memo(ChatBubble);
