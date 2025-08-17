import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useCustomAlert } from '../components/CustomAlert';
import { getBackupStats } from '../utils/cloudStorage';

const SettingsScreen = ({ navigation }) => {
  const [backupStats, setBackupStats] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
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

  const handleBackupPress = () => {
    navigation.navigate('Backup');
  };

  const handleAboutPress = () => {
    showAlert({
      type: 'info',
      title: 'About MediCare',
      message: 'MediCare v1.2.0\n\nA comprehensive animal medicine tracking app with traditional remedy support.\n\nFeatures:\n• Medicine & Desi Totka management\n• Automatic data backup & restore\n• PDF export functionality\n• Image storage & management\n\nBuilt with React Native & Expo',
      confirmText: 'OK',
    });
  };

  const handlePrivacyPress = () => {
    showAlert({
      type: 'info',
      title: 'Privacy Policy',
      message: 'Your data is stored locally on your device. We do not collect or transmit any personal information. All backups are stored locally and can be exported as PDF files.',
      confirmText: 'OK',
    });
  };

  const renderSettingItem = (icon, title, subtitle, onPress, rightComponent = null, showArrow = true) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={24} color="#4A90E2" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      {rightComponent}
      {showArrow && <Ionicons name="chevron-forward" size={20} color="#6B7280" />}
    </TouchableOpacity>
  );

  const renderBackupStatus = () => {
    if (!backupStats) return null;

    return (
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>📊 Data Status</Text>
        
        <View style={styles.statusRow}>
          <Ionicons name="medical" size={20} color="#4A90E2" />
          <Text style={styles.statusText}>
            Current Entries: {backupStats.currentMedicineCount}
          </Text>
        </View>
        
        <View style={styles.statusRow}>
          <Ionicons name="cloud" size={20} color={backupStats.hasLocalBackup ? "#10B981" : "#6B7280"} />
          <Text style={styles.statusText}>
            Manual Backup: {backupStats.manualBackupExists ? "Available" : "Not Available"}
          </Text>
        </View>
        
        {backupStats.manualBackupExists && (
          <View style={styles.statusRow}>
            <Ionicons name="time" size={20} color="#F59E0B" />
            <Text style={styles.statusText}>
              Last Backup: {backupStats.manualBackupTime ? new Date(backupStats.manualBackupTime).toLocaleDateString() : "Unknown"}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="settings" size={32} color="#4A90E2" />
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>
            Configure your MediCare experience
          </Text>
        </View>

        {/* Data Status */}
        {renderBackupStatus()}

        {/* Data Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💾 Data Management</Text>
          
          {renderSettingItem(
            'cloud-upload',
            'Backup & Restore',
            'Manage your data backups and restore options',
            handleBackupPress
          )}
          
          {renderSettingItem(
            'download',
            'Export Data',
            'Export your data to PDF format',
            () => navigation.navigate('Backup'),
            null,
            false
          )}
        </View>

        {/* App Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ App Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="notifications" size={24} color="#4A90E2" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Notifications</Text>
              <Text style={styles.settingSubtitle}>Receive app notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#E5E7EB', true: '#4A90E2' }}
              thumbColor={notificationsEnabled ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="refresh" size={24} color="#4A90E2" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Auto Backup</Text>
              <Text style={styles.settingSubtitle}>Automatically backup data every 24 hours</Text>
            </View>
            <Switch
              value={autoBackupEnabled}
              onValueChange={setAutoBackupEnabled}
              trackColor={{ false: '#E5E7EB', true: '#4A90E2' }}
              thumbColor={autoBackupEnabled ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
        </View>

        {/* Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ Information</Text>
          
          {renderSettingItem(
            'information-circle',
            'About MediCare',
            'App version and information',
            handleAboutPress
          )}
          
          {renderSettingItem(
            'shield-checkmark',
            'Privacy Policy',
            'How we handle your data',
            handlePrivacyPress
          )}
        </View>

        {/* Version Info */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>MediCare v1.2.0</Text>
          <Text style={styles.versionSubtext}>Built with ❤️ for animal care</Text>
        </View>
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
  statusContainer: {
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
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 15,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 10,
    flex: 1,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 15,
  },
  settingItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  versionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 5,
  },
  versionSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default SettingsScreen;
