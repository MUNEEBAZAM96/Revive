import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { palette } from '@/constants/Colors';

const RESOURCES = [
  {
    id: 'lifeline',
    name: '988 Suicide & Crisis Lifeline',
    detail: 'Free, confidential, 24/7 (US)',
    actionLabel: 'Call 988',
    url: 'tel:988',
  },
  {
    id: 'crisis-text',
    name: 'Crisis Text Line',
    detail: 'Text HOME to 741741 (US)',
    actionLabel: 'Text 741741',
    url: 'sms:741741',
  },
  {
    id: 'samhsa',
    name: 'SAMHSA National Helpline',
    detail: 'Substance use & mental health referrals, 24/7',
    actionLabel: 'Call 1-800-662-4357',
    url: 'tel:18006624357',
  },
];

export default function CrisisResourcesScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>You deserve support right now</Text>
      <Text style={styles.subtitle}>
        If you are in immediate danger, call your local emergency number (911
        in the US). These services are free and confidential.
      </Text>

      {RESOURCES.map((resource) => (
        <View key={resource.id} style={styles.card}>
          <Text style={styles.resourceName}>{resource.name}</Text>
          <Text style={styles.resourceDetail}>{resource.detail}</Text>
          <Pressable
            style={styles.callButton}
            onPress={() => Linking.openURL(resource.url)}>
            <Text style={styles.callButtonText}>{resource.actionLabel}</Text>
          </Pressable>
        </View>
      ))}

      <Pressable style={styles.closeButton} onPress={() => router.back()}>
        <Text style={styles.closeButtonText}>Close</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.surface },
  content: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '700', color: palette.textPrimary },
  subtitle: {
    fontSize: 15,
    color: palette.textSecondary,
    marginTop: 10,
    lineHeight: 22,
  },
  card: {
    backgroundColor: palette.surfaceMuted,
    borderRadius: 14,
    padding: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: palette.border,
  },
  resourceName: { fontSize: 17, fontWeight: '700', color: palette.textPrimary },
  resourceDetail: { fontSize: 14, color: palette.textSecondary, marginTop: 4 },
  callButton: {
    backgroundColor: palette.danger,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 14,
  },
  callButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  closeButton: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  closeButtonText: { color: palette.textPrimary, fontSize: 15, fontWeight: '600' },
});
