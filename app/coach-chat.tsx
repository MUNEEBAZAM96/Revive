import { useLocalSearchParams } from 'expo-router';

import CoachChat from '@/components/coach/CoachChat';
import type { QuickActionId } from '@/services/coachService';

export default function CoachChatRoute() {
  const params = useLocalSearchParams<{
    conversationId: string;
    actionId?: string;
    prompt?: string;
  }>();

  if (!params.conversationId) return null;

  return (
    <CoachChat
      conversationId={params.conversationId}
      autoPrompt={params.prompt}
      autoActionId={params.actionId as QuickActionId | undefined}
    />
  );
}
