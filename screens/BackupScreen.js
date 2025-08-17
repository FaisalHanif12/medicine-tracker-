import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useCustomAlert } from '../components/CustomAlert';
import {
  createBackupData,
  saveBackupLocally,
  getLocalBackup,
  exportDataToFile,
  importDataFromFile,
  restoreFromBackup,
  getBackupStats,
  performAutoBackup,
  getDeviceId,
} from '../utils/cloudStorage';

const BackupScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [backupStats, setBackupStats] = useState(null);
  const { showAlert, AlertComponent } = useCustomAlert();

  useEffect(() => {
    loadBackupStats();
  }, []);

  const loadBackupStats = async () => {
    try {
      const stats = await getBackupStats();
      setBackupStats(stats);
    } catch (error) {
      console.error('Error loading backup stats:', error);
    }
  };

  const handleManualBackup = async () => {
    setLoading(true);
    try {
      console.log('🔄 Creating manual backup...');
      const backupData = await createBackupData();
      await saveBackupLocally(backupData);
      
      showAlert({
        type: 'success',
        title: '✅ Backup Created Successfully!',
        message: `Your data has been backed up locally. ${backupData.totalCount} medicines saved.`,
        confirmText: 'Great!',
        onConfirm: () => loadBackupStats(),
      });
    } catch (error) {
      console.error('Backup error:', error);
      showAlert({
        type: 'error',
        title: 'Backup Failed',
        message: 'We couldn\'t create a backup. Please try again.',
        confirmText: 'Try Again',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      console.log('📤 Exporting data to PDF...');
      const exportResult = await exportDataToFile();
      
      if (exportResult.success) {
        // Share the PDF file
        if (Platform.OS !== 'web' && await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(exportResult.fileUri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Export MediCare Data',
          });
        }
        
        showAlert({
          type: 'success',
          title: '📤 Data Exported Successfully!',
          message: `Your data has been exported to PDF: ${exportResult.fileName}`,
          confirmText: 'OK',
        });
      } else {
        throw new Error(exportResult.error);
      }
    } catch (error) {
      console.error('Export error:', error);
      showAlert({
        type: 'error',
        title: 'Export Failed',
        message: 'We couldn\'t export your data. Please try again.',
        confirmText: 'Try Again',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreFromBackup = async () => {
    const localBackup = await getLocalBackup();
    
    if (!localBackup) {
      showAlert({
        type: 'warning',
        title: 'No Backup Found',
        message: 'There\'s no local backup to restore from. Please create a backup first.',
        confirmText: 'OK',
      });
      return;
    }

    showAlert({
      type: 'confirm',
      title: '🔄 Restore from Backup',
      message: `This will restore ${localBackup.totalCount} medicines from your local backup. Current data will be replaced. Are you sure?`,
      showCancel: true,
      confirmText: 'Restore',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setLoading(true);
        try {
          console.log('🔄 Restoring from local backup...');
          const restoreResult = await restoreFromBackup(localBackup);
          
          if (restoreResult.success) {
            showAlert({
              type: 'success',
              title: '✅ Restore Successful!',
              message: `Successfully restored ${restoreResult.restoredCount} medicines from backup.`,
              confirmText: 'Great!',
              onConfirm: () => {
                loadBackupStats();
                navigation.navigate('ViewMedicines');
              },
            });
          } else {
            throw new Error(restoreResult.error);
          }
        } catch (error) {
          console.error('Restore error:', error);
          showAlert({
            type: 'error',
            title: 'Restore Failed',
            message: 'We couldn\'t restore your data. Please try again.',
            confirmText: 'Try Again',
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleForceAutoBackup = async () => {
    setLoading(true);
    try {
      console.log('🔄 Forcing auto backup...');
      await performAutoBackup();
      
      showAlert({
        type: 'success',
        title: '✅ Auto Backup Completed!',
        message: 'Your data has been automatically backed up.',
        confirmText: 'Great!',
        onConfirm: () => loadBackupStats(),
      });
    } catch (error) {
      console.error('Auto backup error:', error);
      showAlert({
        type: 'error',
        title: 'Auto Backup Failed',
        message: 'We couldn\'t perform the auto backup. Please try again.',
        confirmText: 'Try Again',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderBackupStats = () => {
    if (!backupStats) return null;

    return (
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>📊 Backup Statistics</Text>
        
        <View style={styles.statRow}>
          <Ionicons name="medical" size={20} color="#4A90E2" />
          <Text style={styles.statText}>
            Current Medicines: {backupStats.currentMedicineCount}
          </Text>
        </View>
        
        <View style={styles.statRow}>
          <Ionicons name="cloud" size={20} color={backupStats.hasLocalBackup ? "#10B981" : "#6B7280"} />
          <Text style={styles.statText}>
            Manual Backup: {backupStats.manualBackupExists ? "Available" : "Not Available"}
          </Text>
        </View>
        
        {backupStats.manualBackupExists && (
          <View style={styles.statRow}>
            <Ionicons name="time" size={20} color="#F59E0B" />
            <Text style={styles.statText}>
              Manual Backup Date: {backupStats.manualBackupTime ? new Date(backupStats.manualBackupTime).toLocaleDateString() : "Unknown"}
            </Text>
          </View>
        )}
        
        {backupStats.manualBackupExists && (
          <View style={styles.statRow}>
            <Ionicons name="archive" size={20} color="#8B5CF6" />
            <Text style={styles.statText}>
              Manual Backup Medicines: {backupStats.manualBackupCount}
            </Text>
          </View>
        )}
        
        {backupStats.lastBackupTime && !backupStats.manualBackupExists && (
          <View style={styles.statRow}>
            <Ionicons name="refresh" size={20} color="#4A90E2" />
            <Text style={styles.statText}>
              Last Auto Backup: {new Date(backupStats.lastBackupTime).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderActionButton = (icon, title, subtitle, onPress, color = "#4A90E2") => (
    <TouchableOpacity
      style={[styles.actionButton, { borderLeftColor: color }]}
      onPress={onPress}
      disabled={loading}
    >
      <View style={styles.actionButtonContent}>
        <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <View style={styles.actionText}>
          <Text style={styles.actionTitle}>{title}</Text>
          <Text style={styles.actionSubtitle}>{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#6B7280" />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="cloud-upload" size={32} color="#4A90E2" />
          <Text style={styles.headerTitle}>Data Backup & Restore</Text>
          <Text style={styles.headerSubtitle}>
            Keep your medicine data safe across app updates
          </Text>
        </View>

        {/* Backup Statistics */}
        {renderBackupStats()}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>🔄 Backup Actions</Text>
          
          {renderActionButton(
            'cloud-upload',
            'Create Manual Backup',
            'Save your current data locally',
            handleManualBackup,
            '#10B981'
          )}
          
          {renderActionButton(
            'refresh',
            'Force Auto Backup',
            'Trigger automatic backup now',
            handleForceAutoBackup,
            '#F59E0B'
          )}
          
          {renderActionButton(
            'download',
            'Export to PDF',
            'Export data to shareable PDF file',
            handleExportData,
            '#8B5CF6'
          )}
          
          {renderActionButton(
            'cloud-download',
            'Restore from Backup',
            'Restore data from local backup',
            handleRestoreFromBackup,
            '#EF4444'
          )}
        </View>

        {/* Info Section */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>ℹ️ How Data Protection Works</Text>
          
          <View style={styles.infoItem}>
            <Ionicons name="shield-checkmark" size={20} color="#10B981" />
            <Text style={styles.infoText}>
              Your data is automatically backed up every 24 hours
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="phone-portrait" size={20} color="#4A90E2" />
            <Text style={styles.infoText}>
              Data is stored locally on your device for privacy
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="sync" size={20} color="#F59E0B" />
            <Text style={styles.infoText}>
              When you update the app, your data is automatically restored
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="images" size={20} color="#8B5CF6" />
            <Text style={styles.infoText}>
              Medicine images are permanently stored and won't be lost
            </Text>
          </View>
        </View>

        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        )}
      </View>
      <AlertComponent />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 5,
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 15,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 10,
    flex: 1,
  },
  actionsContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 10,
  },
});

export default BackupScreen; 