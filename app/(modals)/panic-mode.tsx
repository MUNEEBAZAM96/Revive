import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useGrowthStore } from '@/stores/growthStore';

// A calming breath: a long, slow exhale settles the nervous system.
const PHASES = [
  { key: 'in', label: 'Breathe in', sub: 'Fill slowly', duration: 4000, target: 1.35 },
  { key: 'hold', label: 'Hold', sub: 'Stay with it', duration: 3000, target: 1.35 },
  { key: 'out', label: 'Breathe out', sub: 'Let it all go', duration: 5000, target: 1 },
] as const;

const ORB = '#65B98A';

export default function PanicModeScreen() {
  const router = useRouter();
  const completeMission = useGrowthStore((s) => s.completeMission);
  const scale = useSharedValue(1);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [breaths, setBreaths] = useState(0);

  useEffect(() => {
    const phase = PHASES[phaseIndex];
    scale.value = withTiming(phase.target, {
      duration: phase.duration,
      easing: Easing.inOut(Easing.ease),
    });
    const timer = setTimeout(() => {
      if (phase.key === 'out') setBreaths((b) => b + 1);
      setPhaseIndex((i) => (i + 1) % PHASES.length);
    }, phase.duration);
    return () => clearTimeout(timer);
  }, [phaseIndex, scale]);

  const orbStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const phase = PHASES[phaseIndex];

  return (
    <LinearGradient colors={['#0E1A15', '#16241E']} style={{ flex: 1 }}>
      {/* Always a dark background here regardless of app theme, so the status
          bar icons must always be light — overrides the app-wide setting. */}
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1 }}>
        <View className="flex-1 px-6">
          {/* Reassurance */}
          <View className="pt-4">
            <Text className="text-center text-[26px] font-bold text-white">
              You&apos;re safe. This will pass.
            </Text>
            <Text className="mt-2 text-center text-[15px] leading-6 text-white/70">
              Let&apos;s breathe through it together. Follow the circle.
            </Text>
          </View>

          {/* Breathing orb */}
          <View className="flex-1 items-center justify-center">
            <View className="h-[300px] w-[300px] items-center justify-center">
              <Animated.View
                style={[orbStyle, { position: 'absolute', alignItems: 'center', justifyContent: 'center' }]}>
                <View
                  style={{
                    width: 300,
                    height: 300,
                    borderRadius: 150,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(101,185,138,0.08)',
                  }}>
                  <View
                    style={{
                      width: 220,
                      height: 220,
                      borderRadius: 110,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(101,185,138,0.14)',
                    }}>
                    <View
                      style={{
                        width: 150,
                        height: 150,
                        borderRadius: 75,
                        backgroundColor: ORB,
                      }}
                    />
                  </View>
                </View>
              </Animated.View>

              {/* Phase text stays centered and legible (not scaled). */}
              <View className="items-center">
                <Text className="text-[26px] font-bold text-white">{phase.label}</Text>
                <Text className="mt-1 text-[14px] text-white/70">{phase.sub}</Text>
              </View>
            </View>

            <Text className="mt-2 text-[13px] text-white/50">
              {breaths === 0 ? 'Take your time' : `${breaths} calming ${breaths === 1 ? 'breath' : 'breaths'}`}
            </Text>
          </View>

          {/* Compact grounding reminder */}
          <View className="rounded-2xl bg-white/[0.06] px-4 py-3">
            <Text className="text-[13px] font-semibold text-white/90">
              Or ground yourself — notice:
            </Text>
            <Text className="mt-1 text-[13px] leading-5 text-white/70">
              5 you can see · 4 you can touch · 3 you can hear · 2 you can smell · 1 you can taste
            </Text>
          </View>

          {/* Actions — calm, never alarming */}
          <View className="mb-4 mt-4">
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                // Completing at least one full breath cycle counts as the
                // Breathing Session mission — a token sign this was used, not
                // just opened and dismissed.
                if (breaths >= 1) completeMission('breathing_session');
                router.back();
              }}
              className="items-center rounded-2xl bg-revive-primary py-4 active:scale-95 dark:bg-revive-primary-dark">
              <Text className="text-base font-semibold text-white">I&apos;m feeling calmer</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(modals)/crisis-resources')}
              className="mt-3 items-center rounded-2xl border border-white/25 py-4 active:opacity-80">
              <Text className="text-base font-medium text-white/90">Talk to someone now</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
