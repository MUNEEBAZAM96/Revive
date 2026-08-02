import { Tabs } from 'expo-router';
import { Easing, StyleSheet, View } from 'react-native';

import { SCENE_TRANSITION_MS, SCENE_TRANSLATE_PX } from '@/animations/navigationAnimations';
import DraggableSupportBubble from '@/components/dashboard/DraggableSupportBubble';
import NavigationContainer from '@/components/navigation/NavigationContainer';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

export default function TabLayout() {
  return (
    <View style={styles.container}>
      <Tabs
        // The custom floating dock replaces the default tab bar entirely —
        // React Navigation still owns routing/focus/lazy-mount, we only
        // replace what renders. See components/navigation/NavigationContainer.
        tabBar={(props) => <NavigationContainer {...props} />}
        screenOptions={{
          // Disable the static render of the header on web
          // to prevent a hydration error in React Navigation v6.
          headerShown: useClientOnlyValue(false, true),
          lazy: true,
          freezeOnBlur: true,
          // Custom fade + slight-translate crossfade between tabs — identical
          // timing on every tab, so none of the five ever feels different.
          sceneStyleInterpolator: ({ current: { progress } }) => ({
            sceneStyle: {
              opacity: progress.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: [0, 1, 0],
              }),
              transform: [
                {
                  translateX: progress.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [-SCENE_TRANSLATE_PX, 0, SCENE_TRANSLATE_PX],
                  }),
                },
              ],
            },
          }),
          transitionSpec: {
            animation: 'timing',
            config: { duration: SCENE_TRANSITION_MS, easing: Easing.out(Easing.cubic) },
          },
        }}>
        <Tabs.Screen name="dashboard" options={{ title: '', headerShown: false }} />
        <Tabs.Screen name="journey" options={{ title: '' }} />
        <Tabs.Screen name="coach" options={{ title: '' }} />
        <Tabs.Screen name="community" options={{ title: '' }} />
        <Tabs.Screen name="settings" options={{ title: '' }} />
      </Tabs>

      {/* Persistent draggable support bubble, visible above every tab. */}
      <DraggableSupportBubble />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
