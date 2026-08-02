/**
 * Daily Missions — six meaningful actions, evaluated fresh each day. Missions
 * mirror real actions elsewhere in the app (games, check-in, breathing, coach,
 * insight, community); the store simply records "done today" flags that those
 * screens flip when the real action happens.
 */

export type MissionId =
  | 'complete_5_games'
  | 'daily_checkin'
  | 'breathing_session'
  | 'talk_with_coach'
  | 'read_insight'
  | 'community_interaction';

export interface MissionDef {
  id: MissionId;
  title: string;
  emoji: string;
  description: string;
  /** Revive Score awarded on completion. */
  reward: number;
  /** Whether this mission is also one of the strict diamond sources. */
  awardsDiamonds: boolean;
}

export const DAILY_MISSIONS: MissionDef[] = [
  {
    id: 'complete_5_games',
    title: 'Complete 5 Games',
    emoji: '🎮',
    description: "Finish today's full mind-training playlist.",
    reward: 20,
    awardsDiamonds: true, // paired with the playlist-completion diamond bonus
  },
  {
    id: 'daily_checkin',
    title: 'Daily Check-In',
    emoji: '📝',
    description: 'Take a moment to check in with how you feel.',
    reward: 10,
    awardsDiamonds: false,
  },
  {
    id: 'breathing_session',
    title: 'Breathing Session',
    emoji: '🧘',
    description: 'Complete a guided breathing exercise.',
    reward: 10,
    awardsDiamonds: false,
  },
  {
    id: 'talk_with_coach',
    title: 'Talk with Coach',
    emoji: '💬',
    description: 'Send your coach a message.',
    reward: 10,
    awardsDiamonds: false,
  },
  {
    id: 'read_insight',
    title: "Read Today's Insight",
    emoji: '💡',
    description: "Open your coach's insight for today.",
    reward: 10,
    awardsDiamonds: false,
  },
  {
    id: 'community_interaction',
    title: 'Community Interaction',
    emoji: '🤝',
    description: 'Encourage someone in the community.',
    reward: 10,
    awardsDiamonds: true, // "helping community" diamond source
  },
];

export function missionDef(id: MissionId): MissionDef {
  const found = DAILY_MISSIONS.find((m) => m.id === id);
  if (!found) throw new Error(`Unknown mission: ${id}`);
  return found;
}
