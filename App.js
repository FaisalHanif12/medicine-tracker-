import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './navigation/AppNavigator';
import { migrateMedicinesToPermanentStorage } from './utils/storage';

export default function App() {
  useEffect(() => {
    // Run migration on app startup to convert any existing temporary image URIs to permanent storage
    const runMigration = async () => {
      try {
        console.log('🚀 App starting - checking for image migration...');
        await migrateMedicinesToPermanentStorage();
      } catch (error) {
        console.error('❌ Migration error on startup:', error);
      }
    };
    
    runMigration();
  }, []);

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
