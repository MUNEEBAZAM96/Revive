import { Easing, WithSpringConfig, WithTimingConfig } from 'react-native-reanimated';

/**
 * Shared motion language for the bottom navigation. Every spring/timing used
 * across the nav (indicator, press, icon, label) pulls from here so the whole
 * dock feels like one physical object, not five separately-tuned pieces.
 *
 * Tuned deliberately soft: no overshoot bounce, "physical" not "bouncy".
 */

/** The floating pill sliding + resizing between tabs. */
export const INDICATOR_SPRING: WithSpringConfig = {
  damping: 20,
  stiffness: 260,
  mass: 0.9,
};

/** The 1 → 0.96 → 1 press feedback (180–220ms total, per spec). */
export const PRESS_SPRING: WithSpringConfig = {
  damping: 16,
  stiffness: 380,
  mass: 0.6,
};

/** The 1 → 1.08 → 1 icon pop on selection. */
export const ICON_SELECT_SPRING: WithSpringConfig = {
  damping: 14,
  stiffness: 320,
  mass: 0.5,
};

/** Icon color crossfade + label fade/translate when active state changes. */
export const COLOR_TRANSITION: WithTimingConfig = {
  duration: 220,
  easing: Easing.out(Easing.cubic),
};

export const LABEL_TRANSITION: WithTimingConfig = {
  duration: 200,
  easing: Easing.out(Easing.cubic),
};

/** Bottom bar show/hide when the keyboard opens (e.g. the Coach input). */
export const BAR_VISIBILITY_TIMING: WithTimingConfig = {
  duration: 220,
  easing: Easing.out(Easing.cubic),
};

/** Tab scene fade + translate (screen-to-screen), matches spec's 250–320ms. */
export const SCENE_TRANSITION_MS = 280;
export const SCENE_TRANSLATE_PX = 20;
