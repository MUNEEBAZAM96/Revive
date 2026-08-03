import CommunityComingSoon from '@/components/community/CommunityComingSoon';
import CommunityFeed from '@/components/community/CommunityFeed';
import { FEATURES } from '@/constants/features';

export default function CommunityScreen() {
  return FEATURES.communityEnabled ? <CommunityFeed /> : <CommunityComingSoon />;
}
