import { useRouter } from 'expo-router';

import PremiumPaywall from '@/components/coach/PremiumPaywall';

export default function PremiumPaywallRoute() {
  const router = useRouter();
  return <PremiumPaywall onDismiss={() => router.canGoBack() && router.back()} />;
}
