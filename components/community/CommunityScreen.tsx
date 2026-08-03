import CommunityComingSoon from '@/components/community/CommunityComingSoon';
import CommunityFeed from '@/components/community/CommunityFeed';
import { FEATURES } from '@/constants/features';

/**
 * Lives under components/community/ (not app/(tabs)/) because it's now a
 * page inside SwipePager rather than its own Expo Router route — see
 * components/navigation/MainNavigator.tsx.
 */
export default function CommunityScreen() {
  return FEATURES.communityEnabled ? <CommunityFeed /> : <CommunityComingSoon />;
}
