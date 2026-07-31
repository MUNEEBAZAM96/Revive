import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const GROUNDING_STEPS = [
  '5 things you can see',
  '4 things you can touch',
  '3 things you can hear',
  '2 things you can smell',
  '1 thing you can taste',
];

export default function PanicModeScreen() {
  const router = useRouter();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.35, duration: 4000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 4000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>You're going to be okay.</Text>
        <Text style={styles.subtitle}>
          This feeling is temporary. Breathe with the circle — in as it grows,
          out as it shrinks.
        </Text>

        <View style={styles.breathingArea}>
          <Animated.View style={[styles.breathCircle, { transform: [{ scale: pulse }] }]} />
          <Text style={styles.breathLabel}>Breathe in… breathe out…</Text>
        </View>

        <View style={styles.groundingCard}>
          <Text style={styles.groundingTitle}>Ground yourself — name:</Text>
          {GROUNDING_STEPS.map((step) => (
            <Text key={step} style={styles.groundingStep}>
              • {step}
            </Text>
          ))}
        </View>

        <Pressable
          style={styles.crisisButton}
          onPress={() => router.push('/(modals)/crisis-resources')}>
          <Text style={styles.crisisButtonText}>I need to talk to someone now</Text>
        </Pressable>
        <Pressable style={styles.safeButton} onPress={() => router.back()}>
          <Text style={styles.safeButtonText}>I'm feeling safer now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0b132b' },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', textAlign: 'center' },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
  breathingArea: { alignItems: 'center', marginVertical: 28 },
  breathCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(42,157,143,0.85)',
  },
  breathLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 15, marginTop: 24 },
  groundingCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 18,
  },
  groundingTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  groundingStep: { color: 'rgba(255,255,255,0.85)', fontSize: 15, lineHeight: 26 },
  crisisButton: {
    backgroundColor: '#e63946',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 'auto',
  },
  crisisButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  safeButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  safeButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
