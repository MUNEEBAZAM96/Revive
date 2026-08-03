import { useEffect, useState } from 'react';
import { Linking, Modal, Pressable, Text, TextInput, View } from 'react-native';
import Animated, {
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Check from 'lucide-react-native/icons/check';
import Mic from 'lucide-react-native/icons/mic';
import Square from 'lucide-react-native/icons/square';
import X from 'lucide-react-native/icons/x';

import { useReviveColors } from '@/components/dashboard/theme';
import {
  ExpoSpeechRecognitionModule,
  isSpeechRecognitionSupported,
  useSpeechRecognitionEvent,
} from '@/services/speechRecognitionModule';

type Phase = 'requesting' | 'recording' | 'reviewing' | 'denied' | 'unsupported';

type VoiceRecorderProps = {
  visible: boolean;
  onClose: () => void;
  /** Called with the reviewed transcript once the user taps Send. */
  onSubmit: (text: string) => void;
};

/** Five bars that react to live input volume — a lightweight, premium waveform without a canvas/SVG dependency. */
type WaveformBars = [SharedValue<number>, SharedValue<number>, SharedValue<number>, SharedValue<number>, SharedValue<number>];

function Waveform({ bars }: { bars: WaveformBars }) {
  return (
    <View className="flex-row items-center justify-center" style={{ height: 48 }}>
      {bars.map((bar, i) => (
        <WaveBar key={i} heightValue={bar} />
      ))}
    </View>
  );
}

function WaveBar({ heightValue }: { heightValue: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({ height: heightValue.value }));
  return (
    <Animated.View
      style={[style, { width: 5, borderRadius: 3, marginHorizontal: 4 }]}
      className="bg-revive-primary dark:bg-revive-primary-dark"
    />
  );
}

const BAR_JITTER = [0.65, 0.95, 1.15, 0.9, 0.7];

/**
 * The voice input flow: record → live waveform → transcript review → send.
 * Requires expo-speech-recognition's native module, which means a dev-client
 * rebuild — this can't run inside plain Expo Go, same as expo-sqlite already
 * in this project.
 */
export default function VoiceRecorder({ visible, onClose, onSubmit }: VoiceRecorderProps) {
  const colors = useReviveColors();
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>('requesting');
  const [transcript, setTranscript] = useState('');
  const [editedText, setEditedText] = useState('');

  const bar0 = useSharedValue(8);
  const bar1 = useSharedValue(8);
  const bar2 = useSharedValue(8);
  const bar3 = useSharedValue(8);
  const bar4 = useSharedValue(8);
  const bars: [typeof bar0, typeof bar1, typeof bar2, typeof bar3, typeof bar4] = [
    bar0,
    bar1,
    bar2,
    bar3,
    bar4,
  ];

  useSpeechRecognitionEvent('result', (event) => {
    setTranscript(event.results[0]?.transcript ?? '');
  });

  useSpeechRecognitionEvent('volumechange', (event) => {
    const normalized = Math.max(0, Math.min(1, (event.value + 2) / 12));
    bars.forEach((bar, i) => {
      bar.value = withTiming(8 + normalized * 32 * BAR_JITTER[i], { duration: 120 });
    });
  });

  useSpeechRecognitionEvent('end', () => {
    setPhase((current) => (current === 'recording' ? 'reviewing' : current));
  });

  useSpeechRecognitionEvent('error', (event) => {
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      setPhase('denied');
    } else if (event.error === 'no-speech' || event.error === 'speech-timeout') {
      setPhase('reviewing');
    }
    // Other errors: leave whatever transcript already streamed in place and
    // let the (already ended) recognition session fall through to review.
  });

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setPhase('requesting');
    setTranscript('');
    bars.forEach((bar) => {
      bar.value = 8;
    });

    (async () => {
      if (!isSpeechRecognitionSupported || !ExpoSpeechRecognitionModule?.isRecognitionAvailable()) {
        if (!cancelled) setPhase('unsupported');
        return;
      }
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (cancelled) return;
      if (!result.granted) {
        setPhase('denied');
        return;
      }
      setPhase('recording');
      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        continuous: true,
        volumeChangeEventOptions: { enabled: true, intervalMillis: 100 },
      });
    })();

    return () => {
      cancelled = true;
      ExpoSpeechRecognitionModule?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    setEditedText(transcript);
  }, [transcript]);

  if (!visible) return null;

  const stopRecording = () => ExpoSpeechRecognitionModule?.stop();

  const retry = () => {
    setTranscript('');
    setEditedText('');
    setPhase('recording');
    ExpoSpeechRecognitionModule?.start({
      lang: 'en-US',
      interimResults: true,
      continuous: true,
      volumeChangeEventOptions: { enabled: true, intervalMillis: 100 },
    });
  };

  const send = () => {
    const text = editedText.trim();
    if (text) onSubmit(text);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <Animated.View
          entering={SlideInDown.duration(320).springify().damping(20)}
          className="rounded-t-[32px] bg-revive-bg px-6 pt-6 dark:bg-revive-bg-dark"
          style={{ paddingBottom: insets.bottom + 24 }}>
          <View className="mb-5 h-1.5 w-10 self-center rounded-full bg-revive-secondary/60" />

          {(phase === 'requesting' || phase === 'recording') && (
            <View className="items-center py-4">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-revive-mist dark:bg-revive-mist-dark">
                <Mic size={26} color={colors.primary} />
              </View>
              <Text className="mt-4 text-[15px] font-semibold text-revive-ink dark:text-revive-ink-dark">
                {phase === 'requesting' ? 'One moment…' : 'Listening…'}
              </Text>

              {phase === 'recording' && (
                <>
                  <View className="mt-5">
                    <Waveform bars={bars} />
                  </View>
                  <Text
                    numberOfLines={2}
                    className="mt-3 min-h-[40px] text-center text-[14px] leading-5 text-revive-muted dark:text-revive-muted-dark">
                    {transcript || 'Say something…'}
                  </Text>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Stop recording"
                    onPress={stopRecording}
                    className="mt-6 h-14 w-14 items-center justify-center rounded-full bg-revive-primary active:opacity-85 dark:bg-revive-primary-dark">
                    <Square size={18} color="#FFFFFF" fill="#FFFFFF" />
                  </Pressable>
                </>
              )}
            </View>
          )}

          {phase === 'reviewing' && (
            <View className="py-2">
              <Text className="text-[15px] font-semibold text-revive-ink dark:text-revive-ink-dark">
                Review your message
              </Text>
              <TextInput
                value={editedText}
                onChangeText={setEditedText}
                multiline
                autoFocus
                placeholder="Nothing was heard — type instead?"
                placeholderTextColor={colors.muted}
                className="mt-3 min-h-[90px] rounded-2xl bg-revive-mist px-4 py-3 text-[15px] leading-6 text-revive-ink dark:bg-revive-mist-dark dark:text-revive-ink-dark"
              />
              <View className="mt-4 flex-row gap-3">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Record again"
                  onPress={retry}
                  className="h-12 w-12 items-center justify-center rounded-full bg-revive-mist active:opacity-70 dark:bg-revive-mist-dark">
                  <Mic size={18} color={colors.ink} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Send message"
                  disabled={!editedText.trim()}
                  onPress={send}
                  className={`h-12 flex-1 flex-row items-center justify-center gap-2 rounded-full ${
                    editedText.trim()
                      ? 'bg-revive-primary dark:bg-revive-primary-dark'
                      : 'bg-revive-mist dark:bg-revive-mist-dark'
                  } active:opacity-85`}>
                  <Check size={17} color={editedText.trim() ? '#FFFFFF' : colors.muted} />
                  <Text
                    className={`text-[15px] font-semibold ${
                      editedText.trim() ? 'text-white dark:text-revive-bg-dark' : 'text-revive-muted dark:text-revive-muted-dark'
                    }`}>
                    Send
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {(phase === 'denied' || phase === 'unsupported') && (
            <View className="items-center py-4">
              <Text className="text-[15px] font-semibold text-revive-ink dark:text-revive-ink-dark">
                {phase === 'denied' ? 'Microphone access needed' : 'Voice input isn’t available'}
              </Text>
              <Text className="mt-2 text-center text-[13px] leading-5 text-revive-muted dark:text-revive-muted-dark">
                {phase === 'denied'
                  ? 'Enable microphone and speech recognition access in Settings to talk to your coach.'
                  : 'This device or build doesn’t support on-device speech recognition. You can still type your message.'}
              </Text>
              {phase === 'denied' && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => Linking.openSettings()}
                  className="mt-4 rounded-full bg-revive-primary px-5 py-2.5 active:opacity-85 dark:bg-revive-primary-dark">
                  <Text className="text-[13px] font-semibold text-white dark:text-revive-bg-dark">
                    Open Settings
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            onPress={onClose}
            hitSlop={8}
            className="absolute right-5 top-5 h-8 w-8 items-center justify-center active:opacity-60">
            <X size={18} color={colors.muted} />
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
