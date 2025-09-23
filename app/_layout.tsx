import 'react-native-reanimated';
import 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { LogBox } from 'react-native';
import { UserProvider } from '@/contexts/UserContext';

// Ignore specific warnings that don't affect functionality
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'VirtualizedLists should never be nested',
  'TurboModule method "installTurboModule"',
  'Babel plugin react-native-reanimated/plugin was moved',
]);

export default function RootLayout() {
  useFrameworkReady();

  return (
    <UserProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
            <Stack.Screen name="search" />
            <Stack.Screen name="workspaces/[id]" />
            <Stack.Screen name="workspaces/create" />
            <Stack.Screen name="projects/[id]" />
            <Stack.Screen name="projects/create" />
            <Stack.Screen name="reminders/create" />
            <Stack.Screen name="analytics" />
          </Stack>
          <StatusBar style="auto" />
        </>
      </GestureHandlerRootView>
    </UserProvider>
  );
}