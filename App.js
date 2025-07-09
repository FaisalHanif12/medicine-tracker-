import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Web-compatible status bar handling */}
      {Platform.OS === 'web' ? (
        <View style={styles.webStatusBar} />
      ) : (
        <StatusBar style="light" backgroundColor="#4A90E2" />
      )}
      <AppNavigator />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webStatusBar: {
    height: Platform.OS === 'web' ? 24 : 0,
    backgroundColor: '#4A90E2',
  },
});
