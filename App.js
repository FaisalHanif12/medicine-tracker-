import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './navigation/AppNavigator';
import { migrateMedicinesToPermanentStorage } from './utils/storage';
import { handleAppUpdateDataPreservation, performAutoBackup } from './utils/cloudStorage';

export default function App() {
  useEffect(() => {
    // Run critical startup tasks to preserve data across app updates
    const runStartupTasks = async () => {
      try {
        console.log('🚀 App starting - running critical startup tasks...');
        
        // First, handle app update data preservation (CRITICAL for APK updates)
        const updateResult = await handleAppUpdateDataPreservation();
        if (updateResult.success && updateResult.restoredCount > 0) {
          console.log(`✅ App update data preservation: ${updateResult.restoredCount} medicines restored`);
        } else {
          console.log('✅ App update check completed');
        }
        
        // Second, run image migration for existing data
        await migrateMedicinesToPermanentStorage();
        console.log('✅ Image migration completed');
        
        // Third, perform auto-backup for future updates
        await performAutoBackup();
        console.log('✅ Auto-backup check completed');
        
      } catch (error) {
        console.error('❌ Startup tasks error:', error);
      }
    };
    
    runStartupTasks();
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
