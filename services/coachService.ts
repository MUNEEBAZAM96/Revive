import type { CoachContext } from '@/services/coachContext';

/**
 * The Coach's reply engine. Currently a local, rule-based mock — there is no
 * LLM backend wired in yet, and no API key belongs on-device regardless.
 *
 * Intended production shape (unchanged by this file's internals):
 *
 *   Mobile app → Node API → Context Builder → LLM API → Response → Mobile app
 *
 * `streamCoachReply` is the seam: swap its body for a `fetch` to that Node
 * API (which streams Server-Sent Events / chunked text back), keep the same
 * `AsyncGenerator<string>` signature, and nothing above this file — the
 * store, the hook, the chat screen — needs to change.
 */

export type QuickActionId =
  | 'urge'
  | 'motivate'
  | 'relapse'
  | 'calm'
  | 'tonight'
  | 'progress'
  | 'goal'
  | 'triggers';

export interface QuickAction {
  id: QuickActionId;
  emoji: string;
  label: string;
  /** The message sent to the coach when this chip is tapped. */
  prompt: string;
}

export const QUICK_ACTIONS: QuickAction[] = [
  { id: 'urge', emoji: '🌿', label: 'I have an urge', prompt: 'I have an urge right now.' },
  { id: 'motivate', emoji: '💪', label: 'Motivate me', prompt: 'I need some motivation.' },
  { id: 'relapse', emoji: '😔', label: 'I relapsed', prompt: 'I relapsed.' },
  { id: 'calm', emoji: '🧘', label: 'Calm my mind', prompt: 'Help me calm my mind.' },
  { id: 'tonight', emoji: '🌙', label: 'Help me tonight', prompt: 'I need help getting through tonight.' },
  { id: 'progress', emoji: '📈', label: 'Review my progress', prompt: 'Can you review my progress?' },
  { id: 'goal', emoji: '🎯', label: "Set today's goal", prompt: 'Help me set a goal for today.' },
  { id: 'triggers', emoji: '🧠', label: 'Analyze my triggers', prompt: 'Can you analyze my triggers?' },
];

/** A plain cancellation flag — no fetch/AbortController needed for a local generator. */
export interface CancelToken {
  cancelled: boolean;
}

export function createCancelToken(): CancelToken {
  return { cancelled: false };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function greatestStreakLine(context: CoachContext): string {
  if (context.currentStreak >= 7) {
    return `You're **${context.currentStreak} days** in — that streak is real evidence of what you're capable of.`;
  }
  if (context.currentStreak >= 1) {
    return `${context.currentStreak} day${context.currentStreak === 1 ? '' : 's'} in — every one of them counts, even the hard ones.`;
  }
  return "You're at the start of a new streak right now, and starting is the hardest part.";
}

function composeReply(userMessage: string, context: CoachContext, actionId?: QuickActionId): string {
  const trigger = context.commonTriggers[0];

  switch (actionId) {
    case 'urge':
      return (
        `I hear you. An urge is a wave — it rises, peaks, and passes, usually inside 20 minutes.\n\n` +
        `Right now, try this:\n` +
        `- Name the urge out loud: "I'm having an urge."\n` +
        `- Take 5 slow breaths, longer on the exhale\n` +
        `- Change your environment for 2 minutes — stand up, step outside, run water over your hands\n\n` +
        `${greatestStreakLine(context)} You don't have to make this decision alone — I'm right here with you.`
      );
    case 'motivate':
      return (
        `${greatestStreakLine(context)}\n\n` +
        `Your Revive Score is **${context.reviveScore}**, and you're Level ${context.level} — none of that happened by accident.\n\n` +
        `**Remember why you started:**\n` +
        `1. You chose this — nobody chose it for you\n` +
        `2. Every check-in, every game, every hard "no" already changed you\n` +
        `3. The version of you a month from now is being built today\n\n` +
        `What's one small thing you can do in the next hour to move forward?`
      );
    case 'relapse':
      return (
        `Thank you for telling me. That took honesty, and honesty is what recovery is built on.\n\n` +
        `A relapse is a moment, not a verdict on who you are. Your longest streak was **${context.longestStreak} days** — you've already proven you can do this, which means you can get back to it.\n\n` +
        `**Right now, let's just do the next right thing:**\n` +
        `- Log how you're feeling, no judgment\n` +
        `- Drink some water, get some rest if you can\n` +
        `- Come back tomorrow and start day one again\n\n` +
        `I'm not going anywhere. What led up to it, if you want to talk through it?`
      );
    case 'calm':
      return (
        `Let's slow things down together.\n\n` +
        `**A simple grounding exercise:**\n` +
        `1. Breathe in for 4 counts\n` +
        `2. Hold for 4 counts\n` +
        `3. Breathe out for 6 counts\n` +
        `4. Repeat 4 times\n\n` +
        `While you do that — notice 3 things you can see, 2 things you can hear, 1 thing you can feel. That's it. Just this breath, right now.`
      );
    case 'tonight':
      return (
        `Nights can be the hardest — quieter, more alone with your thoughts. Let's get you a plan.\n\n` +
        `**For tonight:**\n` +
        `- Set a wind-down time and put your phone charging outside the bedroom\n` +
        `- Have a low-effort backup activity ready (a show, a walk, a call to someone)\n` +
        `- Remind yourself: this feeling is temporary, morning always comes\n\n` +
        `${trigger ? `I noticed *${trigger.replace('_', ' ')}* has come up before for you — is that part of tonight?` : "What does tonight actually feel like right now?"}`
      );
    case 'progress':
      return (
        `Here's where things stand:\n\n` +
        `- **Current streak:** ${context.currentStreak} days (longest: ${context.longestStreak})\n` +
        `- **Recovery score:** ${context.recoveryScore}%\n` +
        `- **Revive Score:** ${context.reviveScore} · Level ${context.level}\n` +
        `- **Mind training today:** ${context.gamesCompletedToday} of ${context.gamesTotalToday} games\n` +
        `- **Achievements unlocked:** ${context.achievementsUnlocked}\n\n` +
        `${context.recoveryScore >= 70 ? "That's a strong trend — whatever you're doing, keep doing it." : "There's real movement here, even where it doesn't feel like it yet."} What would you like to focus on next?`
      );
    case 'goal':
      return (
        `Let's make today concrete instead of abstract.\n\n` +
        `A good daily goal is **small enough to definitely finish** and **specific enough to know you did**. For example:\n` +
        `- Complete today's mind-training playlist\n` +
        `- Check in honestly tonight, whatever the day looked like\n` +
        `- Reach out to one supportive person\n\n` +
        `Which one feels right for today — or tell me what's actually on your plate and we'll shape one together.`
      );
    case 'triggers':
      return context.commonTriggers.length > 0
        ? `Looking at your recent check-ins, your most common trigger has been **${context.commonTriggers[0].replace('_', ' ')}**` +
          `${context.commonTriggers[1] ? `, followed by *${context.commonTriggers[1].replace('_', ' ')}*` : ''}.\n\n` +
          `**A pattern worth naming:**\n` +
          `- These moments tend to cluster around specific times or feelings — awareness alone weakens their grip\n` +
          `- Consider a specific plan for the next time ${context.commonTriggers[0].replace('_', ' ')} shows up\n\n` +
          `Want to build that plan together right now?`
        : `You haven't logged enough triggers yet for a clear pattern to show — that's completely normal early on.\n\n` +
          `Next time an urge or a hard moment hits, try naming *what led up to it* in your check-in. After a couple of weeks I'll be able to spot patterns you might not see yourself.`;
    default:
      break;
  }

  return (
    `${greatestStreakLine(context)}\n\n` +
    `Tell me more about what's going on — I'm listening, and everything here stays between us.`
  );
}

/**
 * Streams a reply word-by-word to simulate an LLM response. Checks
 * `cancel.cancelled` between words so "Stop Generating" can interrupt
 * cleanly without leaving a dangling timer.
 */
export async function* streamCoachReply(
  userMessage: string,
  context: CoachContext,
  cancel: CancelToken,
  actionId?: QuickActionId,
): AsyncGenerator<string> {
  await delay(400 + Math.random() * 300); // brief "thinking" pause before the first token
  if (cancel.cancelled) return;

  const full = composeReply(userMessage, context, actionId);
  const tokens = full.split(/(\s+)/); // keep whitespace as its own tokens so words rejoin cleanly

  for (const token of tokens) {
    if (cancel.cancelled) return;
    if (token.trim().length > 0) {
      await delay(18 + Math.random() * 42);
    }
    yield token;
  }
}

/** Streams a short continuation appended to a reply that was cut off by "Stop Generating". */
export async function* streamCoachContinuation(
  context: CoachContext,
  cancel: CancelToken,
): AsyncGenerator<string> {
  await delay(300 + Math.random() * 200);
  if (cancel.cancelled) return;

  const extra = `\n\nPicking back up — ${greatestStreakLine(context)} Let me know if you'd like to keep going.`;
  const tokens = extra.split(/(\s+)/);

  for (const token of tokens) {
    if (cancel.cancelled) return;
    if (token.trim().length > 0) {
      await delay(18 + Math.random() * 42);
    }
    yield token;
  }
}
