import { BlurView } from 'expo-blur';
import { useState } from 'react';
import { Platform, Pressable, TextInput, useColorScheme, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import ArrowUp from 'lucide-react-native/icons/arrow-up';
import Mic from 'lucide-react-native/icons/mic';
import Paperclip from 'lucide-react-native/icons/paperclip';
import Square from 'lucide-react-native/icons/square';

import { useReviveColors } from '@/components/dashboard/theme';

type ChatInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onStop?: () => void;
  onVoicePress?: () => void;
  isGenerating?: boolean;
  disabled?: boolean;
};

/**
 * The floating composer: rounded, blurred, auto-growing up to a cap. Sits as
 * a sibling below the message list — the chat screen drives this component's
 * bottom padding with `useAnimatedKeyboard`, so it stays glued above the
 * keyboard with zero platform branching here.
 */
export default function ChatInput({
  value,
  onChangeText,
  onSend,
  onStop,
  onVoicePress,
  isGenerating = false,
  disabled = false,
}: ChatInputProps) {
  const colors = useReviveColors();
  const scheme = useColorScheme();
  const [inputHeight, setInputHeight] = useState(24);
  const sendScale = useSharedValue(1);

  const canSend = value.trim().length > 0 && !isGenerating && !disabled;

  const sendStyle = useAnimatedStyle(() => ({ transform: [{ scale: sendScale.value }] }));

  const pressIn = () => {
    sendScale.value = withTiming(0.9, { duration: 90 });
  };
  const pressOut = () => {
    sendScale.value = withTiming(1, { duration: 120 });
  };

  return (
    <View
      className="overflow-hidden rounded-[28px] border border-revive-mist dark:border-revive-mist-dark"
      style={{
        boxShadow: '0px 8px 24px rgba(26, 58, 44, 0.12)',
        backgroundColor: scheme === 'dark' ? 'rgba(24, 34, 29, 0.92)' : 'rgba(255, 255, 255, 0.92)',
      }}>
      <BlurView
        intensity={40}
        tint={scheme === 'dark' ? 'dark' : 'light'}
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        className="flex-row items-end gap-2 px-3 py-2.5">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Attach (coming soon)"
          disabled
          className="h-9 w-9 items-center justify-center opacity-40">
          <Paperclip size={19} color={colors.muted} />
        </Pressable>

        <TextInput
          multiline
          value={value}
          onChangeText={onChangeText}
          placeholder="Message your coach…"
          placeholderTextColor={colors.muted}
          editable={!disabled}
          onContentSizeChange={(e) =>
            setInputHeight(Math.min(Math.max(24, e.nativeEvent.contentSize.height), 120))
          }
          className="flex-1 text-[15px] leading-6 text-revive-ink dark:text-revive-ink-dark"
          style={{ height: inputHeight, paddingTop: Platform.OS === 'ios' ? 4 : 0 }}
          accessibilityLabel="Message input"
        />

        {value.trim().length === 0 && !isGenerating && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Record a voice message"
            onPress={onVoicePress}
            disabled={disabled}
            className="h-9 w-9 items-center justify-center rounded-full bg-revive-mist active:opacity-70 dark:bg-revive-mist-dark">
            <Mic size={17} color={colors.primary} />
          </Pressable>
        )}

        {(value.trim().length > 0 || isGenerating) && (
          <Animated.View style={sendStyle}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isGenerating ? 'Stop generating' : 'Send message'}
              onPress={isGenerating ? onStop : onSend}
              onPressIn={pressIn}
              onPressOut={pressOut}
              disabled={!isGenerating && !canSend}
              className={`h-9 w-9 items-center justify-center rounded-full ${
                isGenerating || canSend
                  ? 'bg-revive-primary dark:bg-revive-primary-dark'
                  : 'bg-revive-mist dark:bg-revive-mist-dark'
              }`}>
              {isGenerating ? (
                <Square size={13} color="#FFFFFF" fill="#FFFFFF" />
              ) : (
                <ArrowUp size={18} color={canSend ? '#FFFFFF' : colors.muted} />
              )}
            </Pressable>
          </Animated.View>
        )}
      </BlurView>
    </View>
  );
}
