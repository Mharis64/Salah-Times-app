/**
 * _layout.jsx  — Root Expo Router layout
 * Wraps all screens in a dark Stack navigator.
 */
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#0F172A" />
        <Stack
          screenOptions={{
            headerStyle:     { backgroundColor: '#0F172A' },
            headerTintColor: '#10B981',
            headerTitleStyle: { color: '#F1F5F9', fontWeight: '700', fontSize: 17 },
            contentStyle:    { backgroundColor: '#0F172A' },
            animation:       'slide_from_right',
          }}
        >
          <Stack.Screen name="index"          options={{ headerShown: false }} />
          <Stack.Screen name="masjid/search"  options={{ title: '🔍  Find a Masjid' }} />
          <Stack.Screen name="masjid/[id]"    options={{ title: '🕌  Masjid' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
