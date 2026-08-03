import { useEffect } from 'react';
import { Keyboard, useWindowDimensions } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue, withSpring, type SharedValue } from 'react-native-reanimated';

import { PAGE_CANCEL_SPRING, PAGE_SPRING } from '@/animations/navigationAnimations';
import {
  EDGE_RESISTANCE,
  PAGER_ACTIVE_OFFSET_X,
  PAGER_FAIL_OFFSET_Y,
  SWIPE_COMMIT_DISTANCE_RATIO,
  SWIPE_COMMIT_VELOCITY,
} from '@/constants/navigation';

interface UseSwipeNavigationParams {
  /** The shared "current page" position — read AND written here; every other
   *  piece of the nav (page transforms, dock capsule, icon/label opacity)
   *  only ever reads it, so there's a single owner during a drag. */
  progress: SharedValue<number>;
  count: number;
  /** Called once a page settles, after its spring animation actually finishes — never mid-drag. */
  onCommit: (index: number) => void;
}

/**
 * Builds the Pan gesture that powers "swipe anywhere" between tabs. Swiping
 * left increases `progress` (moves to the next tab), matching the
 * Dashboard → Journey → Coach → Community → Settings order. Disabled the
 * instant the keyboard is visible (Coach's composer/search inputs) by simply
 * ignoring drag updates and springing back to the current page — cheaper and
 * just as effective as tearing down the gesture recognizer itself.
 */
export function useSwipeNavigation({ progress, count, onCommit }: UseSwipeNavigationParams) {
  const { width } = useWindowDimensions();
  const keyboardVisible = useSharedValue(false);
  const startProgress = useSharedValue(0);

  useEffect(() => {
    const showEvent = 'keyboardDidShow';
    const hideEvent = 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => {
      keyboardVisible.value = true;
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      keyboardVisible.value = false;
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardVisible]);

  const pan = Gesture.Pan()
    .activeOffsetX([-PAGER_ACTIVE_OFFSET_X, PAGER_ACTIVE_OFFSET_X])
    .failOffsetY([-PAGER_FAIL_OFFSET_Y, PAGER_FAIL_OFFSET_Y])
    .onStart(() => {
      startProgress.value = progress.value;
    })
    .onUpdate((event) => {
      if (keyboardVisible.value) return;

      const raw = startProgress.value - event.translationX / width;
      if (raw < 0) {
        progress.value = raw * EDGE_RESISTANCE;
      } else if (raw > count - 1) {
        progress.value = count - 1 + (raw - (count - 1)) * EDGE_RESISTANCE;
      } else {
        progress.value = raw;
      }
    })
    .onEnd((event) => {
      const start = startProgress.value;

      if (keyboardVisible.value) {
        progress.value = withSpring(Math.round(start), PAGE_CANCEL_SPRING);
        return;
      }

      const movedBy = progress.value - start;
      const distanceRatio = Math.abs(movedBy);
      const fastFlick = Math.abs(event.velocityX) > SWIPE_COMMIT_VELOCITY;

      let target = Math.round(start);
      if (distanceRatio > SWIPE_COMMIT_DISTANCE_RATIO || fastFlick) {
        const direction = fastFlick ? (event.velocityX < 0 ? 1 : -1) : movedBy > 0 ? 1 : -1;
        target = Math.round(start) + direction;
      }
      target = Math.max(0, Math.min(count - 1, target));

      progress.value = withSpring(target, PAGE_SPRING, (finished) => {
        if (finished) runOnJS(onCommit)(target);
      });
    });

  return pan;
}
