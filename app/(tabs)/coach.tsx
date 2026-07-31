import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { palette } from '@/constants/Colors';

const PLACEHOLDER_MESSAGES = [
  { id: '1', from: 'coach', text: "Hi, I'm your recovery coach. How are you feeling today?" },
  { id: '2', from: 'user', text: 'A bit on edge, honestly. Long day.' },
  {
    id: '3',
    from: 'coach',
    text: "That's completely understandable. Want to talk through what made today hard, or would a quick grounding exercise help more right now?",
  },
] as const;

export default function CoachScreen() {
  const [draft, setDraft] = useState('');

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.notice}>
          Placeholder conversation — the AI backend is not connected yet. The
          coach offers support and coping ideas, not medical advice.
        </Text>
        {PLACEHOLDER_MESSAGES.map((message) => (
          <View
            key={message.id}
            style={[
              styles.bubble,
              message.from === 'user' ? styles.userBubble : styles.coachBubble,
            ]}>
            <Text
              style={message.from === 'user' ? styles.userText : styles.coachText}>
              {message.text}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Message your coach…"
          placeholderTextColor={palette.textSecondary}
          value={draft}
          onChangeText={setDraft}
        />
        <Pressable style={styles.sendButton} onPress={() => setDraft('')}>
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.surfaceMuted },
  content: { padding: 20, paddingBottom: 24 },
  notice: {
    fontSize: 13,
    color: palette.textSecondary,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    padding: 12,
    lineHeight: 19,
    marginBottom: 16,
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  coachBubble: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    alignSelf: 'flex-start',
  },
  userBubble: { backgroundColor: palette.primary, alignSelf: 'flex-end' },
  coachText: { color: palette.textPrimary, fontSize: 15, lineHeight: 21 },
  userText: { color: '#fff', fontSize: 15, lineHeight: 21 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: palette.surface,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: palette.textPrimary,
    backgroundColor: palette.surfaceMuted,
  },
  sendButton: {
    backgroundColor: palette.primary,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  sendText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
