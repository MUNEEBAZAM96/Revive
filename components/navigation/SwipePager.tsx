import { useEffect, useState } from 'react';
import { Freeze } from 'react-freeze';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { PAGE_OPACITY_MIN, PAGE_SCALE_MIN } from '@/animations/navigationAnimations';
import { useMainNavigation } from '@/components/navigation/NavigationContext';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';

type SwipePagerProps = {
  /** One element per tab, in TAB_ORDER — see NavigationContext.tsx. */
  pages: React.ReactNode[];
};

/**
 * The swipeable pager. Every page is absolutely positioned and permanently
 * mounted (never recreated — state, scroll position, chat history, etc. all
 * survive), with its own position purely a transform derived from the shared
 * `progress` value: `translateX = (progress - index) * width`. That single
 * formula is what makes "the current screen moves away, the next slides in"
 * live-follow the finger — there's no separate native scroll to fight with.
 *
 * Pages more than one away from the active one are wrapped in `Freeze`
 * (react-freeze, the same primitive React Navigation's `freezeOnBlur` uses)
 * so they stop re-rendering/ticking timers while off-screen, without ever
 * unmounting — the actual state preservation guarantee.
 *
 * `Freeze` works by suspending its subtree, which means a page frozen from
 * its very first render never actually commits — its mount effects (data
 * hooks, subscriptions) would silently never run. So a page only becomes
 * eligible for freezing once it's been within one page of the active index
 * at least once (mirrors React Navigation's `lazy` + `freezeOnBlur` combo);
 * before that, a not-yet-visited far-away page renders nothing at all rather
 * than being frozen — cheaper, and side-effect-free either way.
 */
export default function SwipePager({ pages }: SwipePagerProps) {
  const { width } = useWindowDimensions();
  const { progress, activeIndex, commit } = useMainNavigation();

  const pan = useSwipeNavigation({ progress, count: pages.length, onCommit: commit });

  const [everNear, setEverNear] = useState<boolean[]>(() =>
    pages.map((_, index) => Math.abs(activeIndex - index) <= 1),
  );
  useEffect(() => {
    setEverNear((current) =>
      current.map((was, index) => was || Math.abs(activeIndex - index) <= 1),
    );
  }, [activeIndex]);

  return (
    <GestureDetector gesture={pan}>
      <View style={StyleSheet.absoluteFill} collapsable={false}>
        {pages.map((page, index) => (
          <PagerSlide
            key={index}
            index={index}
            progress={progress}
            width={width}
            mounted={everNear[index]}
            freeze={Math.abs(activeIndex - index) > 1}>
            {page}
          </PagerSlide>
        ))}
      </View>
    </GestureDetector>
  );
}

type PagerSlideProps = {
  index: number;
  progress: SharedValue<number>;
  width: number;
  mounted: boolean;
  freeze: boolean;
  children: React.ReactNode;
};

function PagerSlide({ index, progress, width, mounted, freeze, children }: PagerSlideProps) {
  const style = useAnimatedStyle(() => {
    const distance = progress.value - index;
    const translateX = distance * width;
    const scale = interpolate(distance, [-1, 0, 1], [PAGE_SCALE_MIN, 1, PAGE_SCALE_MIN], Extrapolation.CLAMP);
    const opacity = interpolate(
      distance,
      [-1, 0, 1],
      [PAGE_OPACITY_MIN, 1, PAGE_OPACITY_MIN],
      Extrapolation.CLAMP,
    );
    return {
      transform: [{ translateX }, { scale }],
      opacity,
    };
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      {mounted && <Freeze freeze={freeze}>{children}</Freeze>}
    </Animated.View>
  );
}
