/**
 * The daily 5-game playlist. One catalog entry per game; each day a
 * deterministic-but-varied selection of 5 is drawn, preferring games not
 * played in the last 2 days so the playlist doesn't feel repetitive, and
 * falling back gracefully once the whole 10-game catalog has been cycled
 * through.
 */

export type GameType =
  | 'word_builder'
  | 'memory_garden'
  | 'reaction_focus'
  | 'impulse_control'
  | 'pattern_match'
  | 'logic_puzzle'
  | 'number_recall'
  | 'color_focus'
  | 'positive_decisions'
  | 'breathing_rhythm';

export type ChallengeCategory =
  | 'Focus'
  | 'Impulse Control'
  | 'Mindfulness'
  | 'Positive Identity'
  | 'Decision Making';

export interface MindChallenge {
  id: string;
  gameType: GameType;
  title: string;
  emoji: string;
  category: ChallengeCategory;
  description: string;
  durationLabel: string;
  durationMinutes: number;
  reward: number;
}

/** The full 10-game catalog — one entry per game, in the order the brief lists them. */
export const CHALLENGES: MindChallenge[] = [
  {
    id: 'word_builder',
    gameType: 'word_builder',
    title: 'Word Builder',
    emoji: '🧩',
    category: 'Positive Identity',
    description: 'Complete the missing letters in words that describe who you are becoming.',
    durationLabel: '2 min',
    durationMinutes: 2,
    reward: 20,
  },
  {
    id: 'memory_garden',
    gameType: 'memory_garden',
    title: 'Memory Garden',
    emoji: '🌸',
    category: 'Focus',
    description: 'Watch the sequence of nature, then repeat it from memory.',
    durationLabel: '3 min',
    durationMinutes: 3,
    reward: 25,
  },
  {
    id: 'reaction_focus',
    gameType: 'reaction_focus',
    title: 'Reaction Focus',
    emoji: '🎯',
    category: 'Focus',
    description: 'Tap only the green circles. Let the red ones pass.',
    durationLabel: '2 min',
    durationMinutes: 2,
    reward: 15,
  },
  {
    id: 'impulse_control',
    gameType: 'impulse_control',
    title: 'Impulse Control',
    emoji: '🔥',
    category: 'Impulse Control',
    description: 'Wait before tapping. Practice delayed gratification.',
    durationLabel: '2 min',
    durationMinutes: 2,
    reward: 20,
  },
  {
    id: 'pattern_match',
    gameType: 'pattern_match',
    title: 'Pattern Match',
    emoji: '🔷',
    category: 'Mindfulness',
    description: 'Match the calming symbols. Slow down and notice.',
    durationLabel: '2 min',
    durationMinutes: 2,
    reward: 15,
  },
  {
    id: 'logic_puzzle',
    gameType: 'logic_puzzle',
    title: 'Logic Puzzle',
    emoji: '🧠',
    category: 'Focus',
    description: 'A small "what comes next" challenge for a clear mind.',
    durationLabel: '2 min',
    durationMinutes: 2,
    reward: 20,
  },
  {
    id: 'number_recall',
    gameType: 'number_recall',
    title: 'Number Recall',
    emoji: '🔢',
    category: 'Focus',
    description: 'Remember a growing number sequence.',
    durationLabel: '2 min',
    durationMinutes: 2,
    reward: 15,
  },
  {
    id: 'color_focus',
    gameType: 'color_focus',
    title: 'Color Focus',
    emoji: '🎨',
    category: 'Focus',
    description: 'Repeat the color sequence back, one shade at a time.',
    durationLabel: '2 min',
    durationMinutes: 2,
    reward: 15,
  },
  {
    id: 'positive_decisions',
    gameType: 'positive_decisions',
    title: 'Positive Decisions',
    emoji: '⚖️',
    category: 'Decision Making',
    description: 'A short recovery scenario — choose the healthiest path.',
    durationLabel: '3 min',
    durationMinutes: 3,
    reward: 20,
  },
  {
    id: 'breathing_rhythm',
    gameType: 'breathing_rhythm',
    title: 'Breathing Rhythm',
    emoji: '🧘',
    category: 'Mindfulness',
    description: 'Settle your nervous system with a steady, guided breath.',
    durationLabel: '3 min',
    durationMinutes: 3,
    reward: 25,
  },
];

export function challengeFor(gameType: GameType): MindChallenge {
  const found = CHALLENGES.find((c) => c.gameType === gameType);
  if (!found) throw new Error(`Unknown game type: ${gameType}`);
  return found;
}

function dayIndex(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000);
}

/** Deterministic per-day shuffle so the playlist is stable all day. */
function seededShuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let state = seed || 1;
  const next = () => {
    // xorshift32 — small, deterministic, good enough for playlist variety.
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0xffffffff;
  };
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const PLAYLIST_SIZE = 5;

/**
 * Today's 5-game playlist. `recentGameTypes` should be the games featured in
 * roughly the last 2 days — they're deprioritized so the same games don't
 * repeat back-to-back, falling back to the full catalog once necessary.
 */
export function generateDailyPlaylist(
  date: Date,
  recentGameTypes: GameType[] = [],
): MindChallenge[] {
  const shuffled = seededShuffle(CHALLENGES, dayIndex(date));
  const fresh = shuffled.filter((c) => !recentGameTypes.includes(c.gameType));
  const pool = fresh.length >= PLAYLIST_SIZE ? fresh : shuffled;
  return pool.slice(0, PLAYLIST_SIZE);
}

export function totalMinutes(playlist: MindChallenge[]): number {
  return playlist.reduce((sum, c) => sum + c.durationMinutes, 0);
}
