import type { useSpeechRecognitionEvent as UseSpeechRecognitionEventType } from 'expo-speech-recognition';

/**
 * `expo-speech-recognition`'s native module throws synchronously the moment
 * it's imported if the app hasn't been rebuilt with it linked (plain Expo Go,
 * or a dev client from before this package was added) — and since that throw
 * happens at module-evaluation time, a plain `import` at the top of
 * VoiceRecorder.tsx takes down the entire chat screen with it (Expo Router
 * then reports "missing default export" as a downstream symptom).
 *
 * Loading it through `require()` inside a try/catch keeps that throw local:
 * everything below degrades to "voice input unsupported" instead of
 * crashing. Once the dev client is rebuilt with the module linked, this
 * silently starts resolving to the real module — no code change needed.
 */
type SpeechRecognitionExports = typeof import('expo-speech-recognition');

let loaded: SpeechRecognitionExports | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  loaded = require('expo-speech-recognition');
} catch {
  loaded = null;
}

export const isSpeechRecognitionSupported = loaded !== null;

export const ExpoSpeechRecognitionModule: SpeechRecognitionExports['ExpoSpeechRecognitionModule'] | null =
  loaded?.ExpoSpeechRecognitionModule ?? null;

export const useSpeechRecognitionEvent: typeof UseSpeechRecognitionEventType =
  loaded?.useSpeechRecognitionEvent ?? (() => {});
