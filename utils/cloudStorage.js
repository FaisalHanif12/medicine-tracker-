import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getMedicines, saveMedicine, clearAllMedicines } from './storage';
import { saveImagesPermanently } from './imageStorage';

const CLOUD_BACKUP_KEY = 'cloud_backup_data';
const DEVICE_ID_KEY = 'device_unique_id';
const LAST_BACKUP_KEY = 'last_backup_timestamp';
const APP_VERSION_KEY = 'app_version';
const AUTO_BACKUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

// Generate unique device ID
export const generateDeviceId = () => {
  return 'device_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
};

// Get or create device ID
export const getDeviceId = async () => {
  try {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = generateDeviceId();
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    return generateDeviceId();
  }
};

// Get current app version
export const getCurrentAppVersion = () => {
  // This will be updated by the app version from app.json
  return '1.2.0';
};

// Check if app was updated
export const checkAppUpdate = async () => {
  try {
    const storedVersion = await AsyncStorage.getItem(APP_VERSION_KEY);
    const currentVersion = getCurrentAppVersion();
    
    if (!storedVersion) {
      // First time app launch
      await AsyncStorage.setItem(APP_VERSION_KEY, currentVersion);
      return { isUpdated: false, isFirstLaunch: true };
    }
    
    if (storedVersion !== currentVersion) {
      // App was updated
      await AsyncStorage.setItem(APP_VERSION_KEY, currentVersion);
      return { isUpdated: true, oldVersion: storedVersion, newVersion: currentVersion };
    }
    
    return { isUpdated: false, isFirstLaunch: false };
  } catch (error) {
    console.error('Error checking app update:', error);
    return { isUpdated: false, isFirstLaunch: false };
  }
};

// Create backup data structure
export const createBackupData = async () => {
  try {
    const medicines = await getMedicines();
    const deviceId = await getDeviceId();
    
    // Convert images to base64 for cloud storage
    const medicinesWithBase64Images = await Promise.all(
      medicines.map(async (medicine) => {
        if (medicine.images && medicine.images.length > 0) {
          const base64Images = await Promise.all(
            medicine.images.map(async (imageUri) => {
              try {
                const base64 = await FileSystem.readAsStringAsync(imageUri, {
                  encoding: FileSystem.EncodingType.Base64,
                });
                return {
                  base64,
                  filename: imageUri.split('/').pop(),
                  originalUri: imageUri
                };
              } catch (error) {
                console.warn('Could not convert image to base64:', imageUri);
                return null;
              }
            })
          );
          return {
            ...medicine,
            images: base64Images.filter(img => img !== null)
          };
        }
        return medicine;
      })
    );

    return {
      deviceId,
      timestamp: new Date().toISOString(),
      version: '1.0',
      appVersion: getCurrentAppVersion(),
      medicines: medicinesWithBase64Images,
      totalCount: medicines.length
    };
  } catch (error) {
    console.error('Error creating backup data:', error);
    throw error;
  }
};

// Save backup to local storage (as fallback)
export const saveBackupLocally = async (backupData) => {
  try {
    await AsyncStorage.setItem(CLOUD_BACKUP_KEY, JSON.stringify(backupData));
    await AsyncStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
    console.log('✅ Backup saved locally');
    return true;
  } catch (error) {
    console.error('Error saving backup locally:', error);
    return false;
  }
};

// Get local backup
export const getLocalBackup = async () => {
  try {
    const backupJson = await AsyncStorage.getItem(CLOUD_BACKUP_KEY);
    return backupJson ? JSON.parse(backupJson) : null;
  } catch (error) {
    console.error('Error getting local backup:', error);
    return null;
  }
};

// Export data to PDF format
export const exportDataToFile = async () => {
  try {
    const backupData = await createBackupData();
    
    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>MediCare Data Export</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4A90E2; padding-bottom: 20px; }
          .title { color: #4A90E2; font-size: 24px; margin-bottom: 10px; }
          .subtitle { color: #666; font-size: 16px; }
          .stats { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 30px; }
          .stat-item { margin: 8px 0; }
          .medicine-section { margin-bottom: 30px; }
          .medicine-header { background: #4A90E2; color: white; padding: 10px; border-radius: 5px; margin-bottom: 15px; }
          .medicine-name { font-size: 18px; font-weight: bold; }
          .medicine-details { margin: 10px 0; }
          .detail-label { font-weight: bold; color: #333; }
          .detail-value { color: #666; margin-left: 10px; }
          .category-badge { display: inline-block; background: #10B981; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; margin-left: 10px; }
          .desi-totka { background: #F59E0B; }
          .footer { text-align: center; margin-top: 40px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">🐄 MediCare Data Export</div>
          <div class="subtitle">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
        </div>
        
        <div class="stats">
          <div class="stat-item"><strong>Total Entries:</strong> ${backupData.totalCount}</div>
          <div class="stat-item"><strong>Device ID:</strong> ${backupData.deviceId}</div>
          <div class="stat-item"><strong>Export Date:</strong> ${new Date().toLocaleDateString()}</div>
        </div>
        
        ${backupData.medicines.map((medicine, index) => `
          <div class="medicine-section">
            <div class="medicine-header">
              <span class="medicine-name">${medicine.name}</span>
              <span class="category-badge ${medicine.category === 'desi_totka' ? 'desi-totka' : ''}">
                ${medicine.category === 'desi_totka' ? '🌿 Traditional Remedy' : '💊 Medicine'}
              </span>
            </div>
            
            <div class="medicine-details">
              <div><span class="detail-label">Animal:</span> <span class="detail-value">${medicine.animal}</span></div>
              <div><span class="detail-label">Details:</span> <span class="detail-value">${medicine.details}</span></div>
              <div><span class="detail-label">Purpose:</span> <span class="detail-value">${medicine.purpose}</span></div>
              ${medicine.category === 'desi_totka' && medicine.howToMake ? 
                `<div><span class="detail-label">How to Make:</span> <span class="detail-value">${medicine.howToMake}</span></div>` : ''
              }
              <div><span class="detail-label">Added:</span> <span class="detail-value">${new Date(medicine.createdAt).toLocaleDateString()}</span></div>
              ${medicine.images && medicine.images.length > 0 ? 
                `<div><span class="detail-label">Images:</span> <span class="detail-value">${medicine.images.length} image(s)</span></div>` : ''
              }
            </div>
          </div>
        `).join('')}
        
        <div class="footer">
          <p>This document was automatically generated by MediCare App</p>
          <p>For support, contact your app administrator</p>
        </div>
      </body>
      </html>
    `;
    
    // Generate PDF
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    
    const fileName = `medicare_export_${new Date().toISOString().split('T')[0]}.pdf`;
    
    console.log('✅ Data exported to PDF:', uri);
    return {
      success: true,
      fileUri: uri,
      fileName,
      data: backupData
    };
  } catch (error) {
    console.error('Error exporting data to PDF:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Import data from file
export const importDataFromFile = async (fileUri) => {
  try {
    const fileContent = await FileSystem.readAsStringAsync(fileUri);
    const backupData = JSON.parse(fileContent);
    
    // Validate backup data structure
    if (!backupData.medicines || !Array.isArray(backupData.medicines)) {
      throw new Error('Invalid backup file format');
    }
    
    return await restoreFromBackup(backupData);
  } catch (error) {
    console.error('Error importing data from file:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Restore data from backup
export const restoreFromBackup = async (backupData, mergeWithExisting = false) => {
  try {
    console.log('🔄 Starting data restoration...');
    
    if (!mergeWithExisting) {
      // Clear existing data
      await clearAllMedicines();
    }
    
    let restoredCount = 0;
    let errorCount = 0;
    
    for (const medicine of backupData.medicines) {
      try {
        // Convert base64 images back to files
        let restoredImages = [];
        if (medicine.images && medicine.images.length > 0) {
          for (const imageData of medicine.images) {
            if (imageData.base64 && imageData.filename) {
              try {
                // Create temporary file from base64
                const tempUri = `${FileSystem.cacheDirectory}temp_${imageData.filename}`;
                await FileSystem.writeAsStringAsync(tempUri, imageData.base64, {
                  encoding: FileSystem.EncodingType.Base64,
                });
                restoredImages.push(tempUri);
              } catch (imageError) {
                console.warn('Could not restore image:', imageData.filename);
              }
            }
          }
        }
        
        // Save medicine with restored images
        const medicineToRestore = {
          ...medicine,
          images: restoredImages
        };
        
        // Remove backup-specific fields
        delete medicineToRestore.id; // Let saveMedicine generate new ID
        
        await saveMedicine(medicineToRestore);
        restoredCount++;
        
      } catch (medicineError) {
        console.error('Error restoring medicine:', medicine.name, medicineError);
        errorCount++;
      }
    }
    
    console.log(`✅ Restoration complete: ${restoredCount} medicines restored, ${errorCount} errors`);
    
    return {
      success: true,
      restoredCount,
      errorCount,
      totalCount: backupData.medicines.length
    };
    
  } catch (error) {
    console.error('Error restoring from backup:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Auto backup functionality
export const shouldAutoBackup = async () => {
  try {
    const lastBackup = await AsyncStorage.getItem(LAST_BACKUP_KEY);
    if (!lastBackup) return true;
    
    const lastBackupTime = new Date(lastBackup).getTime();
    const now = new Date().getTime();
    
    return (now - lastBackupTime) > AUTO_BACKUP_INTERVAL;
  } catch (error) {
    console.error('Error checking auto backup:', error);
    return true;
  }
};

// Perform auto backup
export const performAutoBackup = async () => {
  try {
    if (await shouldAutoBackup()) {
      console.log('🔄 Performing auto backup...');
      const backupData = await createBackupData();
      await saveBackupLocally(backupData);
      console.log('✅ Auto backup completed');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error performing auto backup:', error);
    return false;
  }
};

// Check for existing backup on app start
export const checkForExistingBackup = async () => {
  try {
    const currentMedicines = await getMedicines();
    const localBackup = await getLocalBackup();
    
    if (localBackup && currentMedicines.length === 0) {
      // No current data but backup exists - likely after app update
      return {
        hasBackup: true,
        backupData: localBackup,
        shouldRestore: true
      };
    }
    
    if (localBackup && currentMedicines.length > 0) {
      // Both exist - check if backup is newer
      const backupTime = new Date(localBackup.timestamp).getTime();
      const latestMedicineTime = Math.max(
        ...currentMedicines.map(m => new Date(m.createdAt || m.updatedAt || 0).getTime())
      );
      
      return {
        hasBackup: true,
        backupData: localBackup,
        shouldRestore: backupTime > latestMedicineTime
      };
    }
    
    return {
      hasBackup: false,
      backupData: null,
      shouldRestore: false
    };
    
  } catch (error) {
    console.error('Error checking for existing backup:', error);
    return {
      hasBackup: false,
      backupData: null,
      shouldRestore: false
    };
  }
};

// Get backup statistics
export const getBackupStats = async () => {
  try {
    const lastBackup = await AsyncStorage.getItem(LAST_BACKUP_KEY);
    const localBackup = await getLocalBackup();
    const currentMedicines = await getMedicines();
    
    // Check if manual backup exists
    const hasManualBackup = !!localBackup;
    const manualBackupTime = localBackup?.timestamp || null;
    const manualBackupCount = localBackup?.totalCount || 0;
    
    return {
      hasLocalBackup: hasManualBackup,
      lastBackupTime: manualBackupTime || lastBackup,
      backupMedicineCount: manualBackupCount,
      currentMedicineCount: currentMedicines.length,
      needsBackup: await shouldAutoBackup(),
      manualBackupExists: hasManualBackup,
      manualBackupTime: manualBackupTime,
      manualBackupCount: manualBackupCount
    };
  } catch (error) {
    console.error('Error getting backup stats:', error);
    return {
      hasLocalBackup: false,
      lastBackupTime: null,
      backupMedicineCount: 0,
      currentMedicineCount: 0,
      needsBackup: true,
      manualBackupExists: false,
      manualBackupTime: null,
      manualBackupCount: 0
    };
  }
};

// Critical function: Handle app update data preservation
export const handleAppUpdateDataPreservation = async () => {
  try {
    console.log('🔄 Checking for app update data preservation...');
    
    const updateInfo = await checkAppUpdate();
    const backupInfo = await checkForExistingBackup();
    
    if (updateInfo.isUpdated) {
      console.log(`📱 App updated from ${updateInfo.oldVersion} to ${updateInfo.newVersion}`);
      
      // If we have backup data and no current data, restore it
      if (backupInfo.hasBackup && backupInfo.shouldRestore) {
        console.log('🔄 Restoring data from backup after app update...');
        const restoreResult = await restoreFromBackup(backupInfo.backupData);
        
        if (restoreResult.success) {
          console.log(`✅ Successfully restored ${restoreResult.restoredCount} medicines after app update`);
          return {
            success: true,
            restoredCount: restoreResult.restoredCount,
            message: `Successfully restored ${restoreResult.restoredCount} medicines after app update`
          };
        } else {
          console.error('❌ Failed to restore data after app update');
          return {
            success: false,
            error: 'Failed to restore data after app update'
          };
        }
      }
    }
    
    // Always perform auto backup
    await performAutoBackup();
    
    return {
      success: true,
      message: 'App update check completed'
    };
    
  } catch (error) {
    console.error('❌ Error during app update data preservation:', error);
    return {
      success: false,
      error: error.message
    };
  }
}; 