import { Text, View } from 'react-native';

/**
 * Future scaffold — small recovery support groups within Community. Not
 * built out yet; exists so the feature's shape is decided ahead of time.
 * Unused while FEATURES.communityEnabled is false.
 */
export default function CommunityGroups() {
  return (
    <View className="flex-1 items-center justify-center bg-revive-bg px-6 dark:bg-revive-bg-dark">
      <Text className="text-center text-[14px] text-revive-muted dark:text-revive-muted-dark">
        Groups are coming with Community.
      </Text>
    </View>
  );
}
