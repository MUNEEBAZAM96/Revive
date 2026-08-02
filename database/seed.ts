import { getDb, newId, nowIso } from './sqlite';
import { DEV_USER_ID } from '@/services/auth';

/**
 * Development seed data. Idempotent: only runs when the dev profile is absent.
 *
 * Rows are written directly (sync_status = 'synced', NOT enqueued) so seeding
 * never floods the sync queue with mock data — this is local dev fixture only.
 */
export async function seedDevData(): Promise<void> {
  const db = await getDb();
  const existing = await db.getFirstAsync('SELECT id FROM profiles WHERE id = ?', [DEV_USER_ID]);
  if (existing) return;

  const now = nowIso();
  const start = new Date();
  start.setDate(start.getDate() - 42);
  const startDate = start.toISOString().slice(0, 10);

  // 1. Profile — Muneeb, 42 days in, goal to quit, night/stress triggers.
  await db.runAsync(
    `INSERT INTO profiles
      (id, supabase_id, display_name, age_range, primary_goal, goals, triggers,
       life_impacts, support_preferences, daily_commitment_minutes,
       recovery_start_date, longest_streak, current_stage, notification_enabled,
       created_at, updated_at, sync_status)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      DEV_USER_ID,
      null,
      'Muneeb',
      '25–34',
      'quit',
      JSON.stringify(['Quit porn completely', 'Build discipline']),
      JSON.stringify(['Night', 'Stress']),
      JSON.stringify(['My confidence', 'My productivity']),
      JSON.stringify(['Daily motivation']),
      10,
      startDate,
      42,
      'Control',
      1,
      now,
      now,
      'synced',
    ],
  );

  // 2. Personalized triggers.
  const triggerSeed: [string, number][] = [
    ['Night', 14],
    ['Stress', 9],
  ];
  for (const [type, frequency] of triggerSeed) {
    await db.runAsync(
      `INSERT INTO user_triggers
        (id, user_id, trigger_type, frequency, last_occurred, created_at, updated_at, sync_status)
       VALUES (?,?,?,?,?,?,?,?)`,
      [newId(), DEV_USER_ID, type, frequency, now, now, now, 'synced'],
    );
  }

  // 3. Coach memory (summary only — never raw conversations).
  await db.runAsync(
    `INSERT INTO coach_memory
      (id, user_id, summary, important_patterns, created_at, updated_at, sync_status)
     VALUES (?,?,?,?,?,?,?)`,
    [
      newId(),
      DEV_USER_ID,
      'User struggles mostly at night and prefers breathing exercises.',
      JSON.stringify({ peakTime: 'night', preferredTool: 'breathing' }),
      now,
      now,
      'synced',
    ],
  );

  // 4. Milestone events at day 7 and day 30.
  for (const day of [7, 30]) {
    const eventDate = new Date(start);
    eventDate.setDate(eventDate.getDate() + day);
    await db.runAsync(
      `INSERT INTO recovery_events
        (id, user_id, event_type, metadata, event_date, created_at, updated_at, sync_status)
       VALUES (?,?,?,?,?,?,?,?)`,
      [
        newId(),
        DEV_USER_ID,
        'milestone',
        JSON.stringify({ label: `Day ${day} milestone` }),
        eventDate.toISOString().slice(0, 10),
        now,
        now,
        'synced',
      ],
    );
  }

  // 5. Thirty days of check-ins for calendar/mood testing. Two storm days
  //    (one weathered with support) so the calendar shows the full story.
  const moods = ['positive', 'normal', 'positive', 'struggling', 'normal', 'heavy', 'positive'];
  const stormDaysAgo = new Set([9, 23]);
  await db.withTransactionAsync(async () => {
    for (let daysAgo = 1; daysAgo <= 30; daysAgo += 1) {
      const day = new Date();
      day.setDate(day.getDate() - daysAgo);
      const date = day.toISOString().slice(0, 10);
      const isStorm = stormDaysAgo.has(daysAgo);
      const mood = isStorm ? 'struggling' : moods[daysAgo % moods.length];
      const urge = (daysAgo % 5) + 1;
      const dayTriggers = isStorm || mood === 'heavy' ? ['Night'] : [];
      await db.runAsync(
        `INSERT INTO daily_checkins
          (id, user_id, date, mood, urge_level, triggers, reflection_note,
           completed_exercises, day_status, weathered_storm, created_at, updated_at, sync_status)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          newId(),
          DEV_USER_ID,
          date,
          mood,
          urge,
          JSON.stringify(dayTriggers),
          daysAgo === 9 ? 'Rough evening, but I opened the app instead.' : null,
          JSON.stringify([]),
          isStorm ? 'storm' : 'growth',
          daysAgo === 9 ? 1 : 0,
          now,
          now,
          'synced',
        ],
      );
    }
  });
}
