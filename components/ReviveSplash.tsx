import { useEffect } from 'react';
import { Text, useColorScheme, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

// Ring circumference for r=100 (2·π·100) and stem dash length.
const RING_LEN = 629;
const STEM_LEN = 150;

type ReviveSplashProps = {
  /** Called once the animation + fade-out completes. */
  onFinish: () => void;
};

/**
 * Revive's animated splash — a seed sprouts into a leafed stem inside a drawing
 * progress ring, then the wordmark rises. Ported from the web SVG/CSS logo to
 * react-native-svg + Reanimated. Plays once on launch, then fades to reveal the
 * app for a premium first impression.
 */
export default function ReviveSplash({ onFinish }: ReviveSplashProps) {
  const isDark = useColorScheme() === 'dark';
  const { width } = useWindowDimensions();
  const svgWidth = Math.min(width * 0.82, 360);
  const svgHeight = svgWidth * 0.75; // viewBox 400x300

  const c = {
    bg: isDark ? '#101714' : '#F7FAF7',
    primary: isDark ? '#65B98A' : '#3A8D6D',
    secondary: '#A8D5BA',
    sun: '#F4D98C',
  };

  // Animated drivers (one per logo element in the original CSS timeline).
  const seed = useSharedValue(0);
  const stem = useSharedValue(STEM_LEN);
  const sun = useSharedValue(0);
  const leafLeft = useSharedValue(0);
  const leafRight = useSharedValue(0);
  const ringBg = useSharedValue(0);
  const ring = useSharedValue(RING_LEN);
  const text = useSharedValue(0);
  const overlay = useSharedValue(1);

  useEffect(() => {
    seed.value = withDelay(100, withTiming(1, { duration: 400 }));
    stem.value = withDelay(
      450,
      withTiming(0, { duration: 800, easing: Easing.inOut(Easing.quad) }),
    );
    sun.value = withDelay(850, withTiming(1, { duration: 700, easing: Easing.out(Easing.quad) }));
    leafLeft.value = withDelay(1050, withTiming(1, { duration: 500, easing: Easing.out(Easing.back(1.6)) }));
    leafRight.value = withDelay(1300, withTiming(1, { duration: 500, easing: Easing.out(Easing.back(1.6)) }));
    ringBg.value = withDelay(1450, withTiming(1, { duration: 500 }));
    ring.value = withDelay(
      1650,
      withTiming(0, { duration: 1100, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
    );
    text.value = withDelay(2350, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));

    // After the sequence, hold briefly then fade the whole overlay away.
    overlay.value = withDelay(
      3100,
      withTiming(0, { duration: 450, easing: Easing.inOut(Easing.quad) }, (finished) => {
        if (finished) runOnJS(onFinish)();
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const seedProps = useAnimatedProps(() => ({ opacity: seed.value }));
  const stemProps = useAnimatedProps(() => ({ strokeDashoffset: stem.value }));
  const sunProps = useAnimatedProps(
    () => ({ opacity: sun.value * 0.35, scale: 0.6 + sun.value * 0.5 }) as object,
  );
  const leafLeftProps = useAnimatedProps(
    () => ({ opacity: leafLeft.value, scale: leafLeft.value }) as object,
  );
  const leafRightProps = useAnimatedProps(
    () => ({ opacity: leafRight.value, scale: leafRight.value }) as object,
  );
  const ringBgProps = useAnimatedProps(() => ({ opacity: ringBg.value }));
  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: ring.value }));

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlay.value }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: text.value,
    transform: [{ translateY: 12 * (1 - text.value) }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        overlayStyle,
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: c.bg,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}>
      <Svg width={svgWidth} height={svgHeight} viewBox="0 0 400 300">
        {/* Progress rings, centered on the plant core (200,165). */}
        <AnimatedCircle
          cx={200}
          cy={165}
          r={100}
          stroke={c.secondary}
          strokeWidth={2}
          fill="none"
          animatedProps={ringBgProps}
        />
        <AnimatedCircle
          cx={200}
          cy={165}
          r={100}
          stroke={c.primary}
          strokeWidth={4.5}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={RING_LEN}
          rotation={-90}
          originX={200}
          originY={165}
          animatedProps={ringProps}
        />

        {/* Warm sunlight glow behind the plant. */}
        <AnimatedCircle
          cx={200}
          cy={165}
          r={70}
          fill={c.sun}
          originX={200}
          originY={165}
          animatedProps={sunProps}
        />

        {/* Organic stem, drawn in. */}
        <AnimatedPath
          d="M 200 240 Q 180 180 203 115"
          stroke={c.primary}
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={STEM_LEN}
          animatedProps={stemProps}
        />

        {/* The initial seed. */}
        <AnimatedCircle cx={200} cy={240} r={5.5} fill={c.primary} animatedProps={seedProps} />

        {/* Left leaf (sage) — pops in from its base. */}
        <G transform="translate(191, 182) rotate(-65)">
          <AnimatedG originX={0} originY={0} animatedProps={leafLeftProps}>
            <Path d="M 0,0 C -18,-20 -22,-45 0,-60 C 22,-45 18,-20 0,0 Z" fill={c.secondary} />
          </AnimatedG>
        </G>

        {/* Right leaf (forest) — higher on the stem. */}
        <G transform="translate(198, 135) rotate(45)">
          <AnimatedG originX={0} originY={0} animatedProps={leafRightProps}>
            <Path d="M 0,0 C -15,-15 -18,-40 0,-52 C 18,-40 15,-15 0,0 Z" fill={c.primary} />
          </AnimatedG>
        </G>
      </Svg>

      <Animated.Text
        style={[
          textStyle,
          {
            marginTop: 20,
            fontSize: 26,
            fontWeight: '600',
            letterSpacing: 8,
            color: c.primary,
          },
        ]}>
        REVIVE
      </Animated.Text>
    </Animated.View>
  );
}
