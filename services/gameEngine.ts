import type { GameType } from './dailyChallengeService';

/**
 * Pure content + config generators for all 10 mind-training games. No storage,
 * no side effects — game components call these and report a GameResult to
 * the growth store via GamePlayModal.
 */

export type Difficulty = 'easy' | 'medium' | 'hard';

/** Difficulty rises with recovery level — the games grow with the user. */
export function resolveDifficulty(level: number): Difficulty {
  if (level < 10) return 'easy';
  if (level < 25) return 'medium';
  return 'hard';
}

export interface GameResult {
  gameType: GameType;
  /** Rounds/breaths/words completed — informational, never competitive. */
  score: number;
  reward: number;
  durationSec: number;
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// --- 1. Word Builder ---------------------------------------------------------

/** Identity words: what the user is building, not what they're avoiding. */
export const IDENTITY_WORDS = [
  'CONFIDENCE',
  'DISCIPLINE',
  'PATIENCE',
  'STRENGTH',
  'FOCUS',
  'GROWTH',
  'COURAGE',
  'BALANCE',
  'CONTROL',
] as const;

export interface WordPuzzle {
  word: string;
  missingIndex: number;
  choices: string[];
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function buildWordPuzzle(word: string): WordPuzzle {
  const missingIndex = Math.floor(Math.random() * word.length);
  const correct = word[missingIndex];
  const distractors = shuffle(ALPHABET.split('').filter((l) => l !== correct)).slice(0, 3);
  return { word, missingIndex, choices: shuffle([correct, ...distractors]) };
}

export function pickWords(count: number): string[] {
  return shuffle([...IDENTITY_WORDS]).slice(0, count);
}

export function wordBuilderRounds(difficulty: Difficulty): number {
  return { easy: 2, medium: 3, hard: 4 }[difficulty];
}

// --- 2. Memory Garden (sequence recall) -------------------------------------

export const GARDEN_ITEMS = ['🌱', '🌿', '🌸', '🌳', '🍃', '🌷'] as const;

export function buildSequence(length: number): string[] {
  const seq: string[] = [];
  for (let i = 0; i < length; i += 1) {
    seq.push(GARDEN_ITEMS[Math.floor(Math.random() * GARDEN_ITEMS.length)]);
  }
  return seq;
}

export function memoryGardenRounds(difficulty: Difficulty): number[] {
  return { easy: [3, 4], medium: [3, 4, 5], hard: [4, 5, 6] }[difficulty];
}

// --- 3. Reaction Focus --------------------------------------------------------

export interface ReactionFocusConfig {
  /** Total prompts shown, mixing green (tap) and red (ignore). */
  totalPrompts: number;
  /** How many of those prompts are red distractors. */
  distractors: number;
  /** Milliseconds each prompt stays live before auto-advancing. */
  showMs: number;
}

export function reactionFocusConfig(difficulty: Difficulty): ReactionFocusConfig {
  return {
    easy: { totalPrompts: 8, distractors: 2, showMs: 1500 },
    medium: { totalPrompts: 10, distractors: 4, showMs: 1200 },
    hard: { totalPrompts: 12, distractors: 5, showMs: 900 },
  }[difficulty];
}

export function buildReactionPrompts(config: ReactionFocusConfig): boolean[] {
  // true = green (tap), false = red (ignore).
  const prompts = Array.from({ length: config.totalPrompts }, (_, i) => i >= config.distractors);
  return shuffle(prompts);
}

// --- 4. Impulse Control (the pause) ------------------------------------------

export function pauseSeconds(difficulty: Difficulty): number {
  return { easy: 8, medium: 10, hard: 15 }[difficulty];
}

// --- 5. Pattern Match ---------------------------------------------------------

export const CALM_SYMBOLS = ['🔷', '🔶', '⭐', '🌙', '☀️', '❄️', '🔺', '⚪'] as const;

export interface PatternRound {
  target: string;
  options: string[];
}

export function buildPatternRound(optionCount: number): PatternRound {
  const pool = shuffle([...CALM_SYMBOLS]).slice(0, optionCount);
  const target = pool[Math.floor(Math.random() * pool.length)];
  return { target, options: shuffle(pool) };
}

export function patternMatchRounds(difficulty: Difficulty): { rounds: number; options: number } {
  return {
    easy: { rounds: 3, options: 3 },
    medium: { rounds: 4, options: 4 },
    hard: { rounds: 5, options: 5 },
  }[difficulty];
}

// --- 6. Logic Puzzle -----------------------------------------------------------

export interface LogicPuzzleRound {
  sequence: number[];
  answer: number;
  choices: number[];
}

export function buildLogicPuzzle(difficulty: Difficulty): LogicPuzzleRound {
  const start = 1 + Math.floor(Math.random() * 5);
  let sequence: number[];

  if (difficulty === 'easy') {
    const step = 1 + Math.floor(Math.random() * 3);
    sequence = [start, start + step, start + step * 2, start + step * 3];
  } else if (difficulty === 'medium') {
    const step = 4 + Math.floor(Math.random() * 4);
    sequence = [start, start + step, start + step * 2, start + step * 3];
  } else {
    // Increasing step: a gentler "reasoning" puzzle, not a trick question.
    sequence = [start, start + 1, start + 3, start + 6];
  }

  const answer =
    difficulty === 'hard'
      ? sequence[3] + 4
      : sequence[3] + (sequence[3] - sequence[2]);
  const distractors = shuffle([answer + 1, answer - 1, answer + 2].filter((n) => n !== answer));
  return { sequence, answer, choices: shuffle([answer, ...distractors.slice(0, 3)]) };
}

export function logicPuzzleRounds(difficulty: Difficulty): number {
  return { easy: 3, medium: 4, hard: 5 }[difficulty];
}

// --- 7. Number Recall ----------------------------------------------------------

export function buildNumberSequence(length: number): number[] {
  return Array.from({ length }, () => Math.floor(Math.random() * 10));
}

export function numberRecallLengths(difficulty: Difficulty): number[] {
  return { easy: [3, 4], medium: [4, 5, 6], hard: [5, 6, 7] }[difficulty];
}

// --- 8. Color Focus --------------------------------------------------------

export const FOCUS_COLORS = [
  { id: 'sage', hex: '#3A8D6D' },
  { id: 'rose', hex: '#F2617D' },
  { id: 'amber', hex: '#F4D98C' },
  { id: 'sky', hex: '#5E7C91' },
] as const;

export function buildColorSequence(length: number): string[] {
  const seq: string[] = [];
  for (let i = 0; i < length; i += 1) {
    seq.push(FOCUS_COLORS[Math.floor(Math.random() * FOCUS_COLORS.length)].id);
  }
  return seq;
}

export function colorFocusLengths(difficulty: Difficulty): number[] {
  return { easy: [3, 4], medium: [4, 5, 6], hard: [5, 6, 7] }[difficulty];
}

// --- 9. Positive Decisions -----------------------------------------------------

export interface DecisionOption {
  label: string;
  isHealthy: boolean;
  feedback: string;
}

export interface DecisionScenario {
  id: string;
  prompt: string;
  options: DecisionOption[];
}

export const DECISION_SCENARIOS: DecisionScenario[] = [
  {
    id: 'lonely_evening',
    prompt: "It's late and you're feeling lonely. What do you do?",
    options: [
      { label: 'Text a friend, even just to say hi', isHealthy: true, feedback: 'Reaching out takes real courage — well done.' },
      { label: 'Scroll aimlessly and hope it passes', isHealthy: false, feedback: 'That’s a common instinct. Next time, try reaching out first.' },
    ],
  },
  {
    id: 'stressful_day',
    prompt: 'Work was overwhelming today. How do you unwind?',
    options: [
      { label: 'Take a short walk to reset', isHealthy: true, feedback: 'Movement is one of the best resets there is.' },
      { label: 'Numb out with your phone for hours', isHealthy: false, feedback: 'Understandable — a short walk might serve you better next time.' },
    ],
  },
  {
    id: 'urge_hits',
    prompt: 'An urge hits out of nowhere. What helps most right now?',
    options: [
      { label: 'Pause and breathe for 10 seconds', isHealthy: true, feedback: 'That pause is exactly where your power lives.' },
      { label: 'Act on it immediately', isHealthy: false, feedback: 'Urges fade fast when given a moment — try the pause next time.' },
    ],
  },
  {
    id: 'proud_moment',
    prompt: 'You just resisted a strong urge. What now?',
    options: [
      { label: 'Acknowledge it — you did something hard', isHealthy: true, feedback: 'Recognizing your wins builds real confidence.' },
      { label: 'Brush it off as no big deal', isHealthy: false, feedback: 'It IS a big deal — try letting yourself feel proud.' },
    ],
  },
  {
    id: 'invited_out',
    prompt: 'Friends invite you out, but part of you wants to isolate. What do you choose?',
    options: [
      { label: 'Go, even if just for a short while', isHealthy: true, feedback: 'Connection heals — showing up matters more than staying long.' },
      { label: 'Cancel and stay in alone', isHealthy: false, feedback: 'Fair enough sometimes — just watch this becoming a pattern.' },
    ],
  },
];

export function pickScenarios(count: number): DecisionScenario[] {
  return shuffle([...DECISION_SCENARIOS]).slice(0, count);
}

export function decisionRounds(difficulty: Difficulty): number {
  return { easy: 2, medium: 3, hard: 4 }[difficulty];
}

// --- 10. Breathing Rhythm ----------------------------------------------------

export const BREATH_PHASES = [
  { key: 'in', label: 'Breathe in', duration: 4000, target: 1.35 },
  { key: 'hold', label: 'Hold', duration: 3000, target: 1.35 },
  { key: 'out', label: 'Breathe out', duration: 5000, target: 1 },
] as const;

export function breathTarget(difficulty: Difficulty): number {
  return { easy: 5, medium: 8, hard: 10 }[difficulty];
}
