/**
 * Future Community service surface. Defines the shape the real
 * implementation will fill in once FEATURES.communityEnabled flips to true.
 * No backend wiring here by design — the local-first data layer under
 * database/ and repositories/ stays disconnected from the running app.
 */

export type CommunityPost = {
  id: string;
  handle: string;
  text: string;
  createdAt: string;
  hearts: number;
};

export type CommunityGroup = {
  id: string;
  name: string;
  memberCount: number;
};

export async function fetchCommunityFeed(): Promise<CommunityPost[]> {
  throw new Error('communityService.fetchCommunityFeed: not implemented yet');
}

export async function fetchCommunityGroups(): Promise<CommunityGroup[]> {
  throw new Error('communityService.fetchCommunityGroups: not implemented yet');
}
