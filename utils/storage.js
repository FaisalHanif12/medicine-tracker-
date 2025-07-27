import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteImages, saveImagesPermanently, migrateOldImages } from './imageStorage';

const MEDICINES_KEY = 'medicines';

// Generate unique ID for medicines
export const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// Save a new medicine entry
export const saveMedicine = async (medicine) => {
  try {
    // Get existing medicines
    const existingMedicines = await getMedicines();
    
    // Save images permanently if they exist
    let permanentImages = [];
    if (medicine.images && medicine.images.length > 0) {
      console.log('💾 Saving images permanently...');
      permanentImages = await saveImagesPermanently(medicine.images);
      console.log('✅ Images saved permanently:', permanentImages.length);
    }
    
    // Add new medicine with unique ID and permanent image URIs
    const newMedicine = {
      id: generateId(),
      ...medicine,
      images: permanentImages,
      createdAt: new Date().toISOString()
    };
    
    const updatedMedicines = [...existingMedicines, newMedicine];
    
    // Save back to AsyncStorage
    await AsyncStorage.setItem(MEDICINES_KEY, JSON.stringify(updatedMedicines));
    
    return newMedicine;
  } catch (error) {
    console.error('Error saving medicine:', error);
    throw error;
  }
};

// Get all medicines
export const getMedicines = async () => {
  try {
    const medicinesJson = await AsyncStorage.getItem(MEDICINES_KEY);
    return medicinesJson ? JSON.parse(medicinesJson) : [];
  } catch (error) {
    console.error('Error getting medicines:', error);
    return [];
  }
};

// Get medicine by ID
export const getMedicineById = async (id) => {
  try {
    const medicines = await getMedicines();
    return medicines.find(medicine => medicine.id === id);
  } catch (error) {
    console.error('Error getting medicine by ID:', error);
    return null;
  }
};

// Delete medicine by ID
export const deleteMedicine = async (id) => {
  try {
    const medicines = await getMedicines();
    const medicineToDelete = medicines.find(medicine => medicine.id === id);
    
    // Delete associated images from permanent storage
    if (medicineToDelete && medicineToDelete.images && medicineToDelete.images.length > 0) {
      console.log('🗑️ Deleting medicine images...');
      await deleteImages(medicineToDelete.images);
      console.log('✅ Medicine images deleted');
    }
    
    const updatedMedicines = medicines.filter(medicine => medicine.id !== id);
    await AsyncStorage.setItem(MEDICINES_KEY, JSON.stringify(updatedMedicines));
    return true;
  } catch (error) {
    console.error('Error deleting medicine:', error);
    return false;
  }
};

// Update medicine entry
export const updateMedicine = async (id, updatedMedicine) => {
  try {
    const medicines = await getMedicines();
    const currentMedicine = medicines.find(medicine => medicine.id === id);
    
    // Handle image updates
    let permanentImages = updatedMedicine.images || [];
    if (updatedMedicine.images && updatedMedicine.images.length > 0) {
      // Check if we have new temporary images that need to be saved permanently
      const newTempImages = updatedMedicine.images.filter(uri => 
        !uri.includes('medicine_images') // Filter out already permanent images
      );
      
      if (newTempImages.length > 0) {
        console.log('💾 Saving new images permanently...');
        const newPermanentImages = await saveImagesPermanently(newTempImages);
        
        // Combine existing permanent images with new ones
        const existingPermanentImages = updatedMedicine.images.filter(uri => 
          uri.includes('medicine_images')
        );
        permanentImages = [...existingPermanentImages, ...newPermanentImages];
        console.log('✅ New images saved permanently:', newPermanentImages.length);
      }
      
      // Delete removed images from permanent storage
      if (currentMedicine && currentMedicine.images) {
        const removedImages = currentMedicine.images.filter(oldUri =>
          !permanentImages.includes(oldUri)
        );
        if (removedImages.length > 0) {
          console.log('🗑️ Deleting removed images...');
          await deleteImages(removedImages);
          console.log('✅ Removed images deleted:', removedImages.length);
        }
      }
    }
    
    const updatedMedicines = medicines.map(medicine => 
      medicine.id === id 
        ? { ...medicine, ...updatedMedicine, images: permanentImages, updatedAt: new Date().toISOString() }
        : medicine
    );
    await AsyncStorage.setItem(MEDICINES_KEY, JSON.stringify(updatedMedicines));
    return updatedMedicines.find(m => m.id === id);
  } catch (error) {
    console.error('Error updating medicine:', error);
    throw error;
  }
};

// Toggle favorite status
export const toggleFavorite = async (id) => {
  try {
    const medicines = await getMedicines();
    const updatedMedicines = medicines.map(medicine => 
      medicine.id === id 
        ? { ...medicine, isFavorite: !medicine.isFavorite, updatedAt: new Date().toISOString() }
        : medicine
    );
    await AsyncStorage.setItem(MEDICINES_KEY, JSON.stringify(updatedMedicines));
    return updatedMedicines.find(m => m.id === id);
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
};

// Get favorite medicines
export const getFavoriteMedicines = async () => {
  try {
    const medicines = await getMedicines();
    return medicines.filter(medicine => medicine.isFavorite);
  } catch (error) {
    console.error('Error getting favorite medicines:', error);
    return [];
  }
};

// Clear all medicines (for testing)
export const clearAllMedicines = async () => {
  try {
    await AsyncStorage.removeItem(MEDICINES_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing medicines:', error);
    return false;
  }
};

// Migrate existing medicines with temporary image URIs to permanent storage
export const migrateMedicinesToPermanentStorage = async () => {
  try {
    console.log('🔄 Starting migration to permanent storage...');
    const medicines = await getMedicines();
    let migratedCount = 0;
    
    const updatedMedicines = [];
    
    for (const medicine of medicines) {
      if (medicine.images && medicine.images.length > 0) {
        // Check if images are already permanent (contain medicine_images path)
        const hasTemporaryImages = medicine.images.some(uri => 
          !uri.includes('medicine_images')
        );
        
        if (hasTemporaryImages) {
          console.log(`🔄 Migrating images for medicine: ${medicine.name}`);
          try {
            const newPermanentImages = await migrateOldImages(medicine.images);
            if (newPermanentImages.length > 0) {
              updatedMedicines.push({
                ...medicine,
                images: newPermanentImages,
                migratedAt: new Date().toISOString()
              });
              migratedCount++;
              console.log(`✅ Migrated ${newPermanentImages.length} images for ${medicine.name}`);
            } else {
              // Keep medicine but with empty images if migration failed
              updatedMedicines.push({
                ...medicine,
                images: [],
                migrationFailed: true,
                migratedAt: new Date().toISOString()
              });
              console.warn(`⚠️ Failed to migrate images for ${medicine.name}, cleared images`);
            }
          } catch (error) {
            console.error(`❌ Error migrating ${medicine.name}:`, error);
            // Keep original medicine unchanged if migration fails
            updatedMedicines.push(medicine);
          }
        } else {
          // Images are already permanent, keep as is
          updatedMedicines.push(medicine);
        }
      } else {
        // No images, keep as is
        updatedMedicines.push(medicine);
      }
    }
    
    // Save the updated medicines
    if (migratedCount > 0) {
      await AsyncStorage.setItem(MEDICINES_KEY, JSON.stringify(updatedMedicines));
      console.log(`✅ Migration complete! Migrated ${migratedCount} medicines to permanent storage.`);
    } else {
      console.log('✅ No migration needed - all images are already permanent.');
    }
    
    return { success: true, migratedCount };
  } catch (error) {
    console.error('❌ Error during migration:', error);
    return { success: false, error: error.message };
  }
}; 

// Test function to simulate app update scenario
export const testDataPreservation = async () => {
  try {
    console.log('🧪 Testing data preservation system...');
    
    // Create some test data
    const testMedicine = {
      name: 'Test Medicine',
      animal: 'Cow',
      details: 'Test medicine for data preservation testing',
      images: [],
      isFavorite: false,
    };
    
    // Save test medicine
    const savedMedicine = await saveMedicine(testMedicine);
    console.log('✅ Test medicine saved:', savedMedicine.id);
    
    // Simulate app update by clearing AsyncStorage but keeping backup
    const medicines = await getMedicines();
    console.log('📊 Current medicines count:', medicines.length);
    
    // Create backup
    const { createBackupData, saveBackupLocally } = require('./cloudStorage');
    const backupData = await createBackupData();
    await saveBackupLocally(backupData);
    console.log('✅ Backup created with', backupData.totalCount, 'medicines');
    
    // Clear current data (simulate app update)
    await clearAllMedicines();
    console.log('🗑️ Current data cleared (simulating app update)');
    
    // Check if backup exists
    const { getLocalBackup, restoreFromBackup } = require('./cloudStorage');
    const localBackup = await getLocalBackup();
    
    if (localBackup) {
      console.log('🔄 Restoring from backup...');
      const restoreResult = await restoreFromBackup(localBackup);
      console.log('✅ Restore result:', restoreResult);
      
      // Verify data is restored
      const restoredMedicines = await getMedicines();
      console.log('📊 Restored medicines count:', restoredMedicines.length);
      
      return {
        success: true,
        originalCount: medicines.length,
        restoredCount: restoredMedicines.length,
        message: 'Data preservation test completed successfully'
      };
    } else {
      throw new Error('No backup found for restoration');
    }
    
  } catch (error) {
    console.error('❌ Data preservation test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}; 