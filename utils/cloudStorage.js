import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
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
  return '1.1.0';
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

// Export data to shareable format
export const exportDataToFile = async () => {
  try {
    const backupData = await createBackupData();
    const fileName = `medicare_backup_${new Date().toISOString().split('T')[0]}.json`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    
    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(backupData, null, 2));
    
    console.log('✅ Data exported to:', fileUri);
    return {
      success: true,
      fileUri,
      fileName,
      data: backupData
    };
  } catch (error) {
    console.error('Error exporting data:', error);
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
    
    return {
      hasLocalBackup: !!localBackup,
      lastBackupTime: lastBackup,
      backupMedicineCount: localBackup?.totalCount || 0,
      currentMedicineCount: currentMedicines.length,
      needsBackup: await shouldAutoBackup()
    };
  } catch (error) {
    console.error('Error getting backup stats:', error);
    return {
      hasLocalBackup: false,
      lastBackupTime: null,
      backupMedicineCount: 0,
      currentMedicineCount: 0,
      needsBackup: true
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