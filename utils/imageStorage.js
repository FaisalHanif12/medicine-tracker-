import * as FileSystem from 'expo-file-system';

// Create a dedicated directory for medicine images
const IMAGES_DIR = `${FileSystem.documentDirectory}medicine_images/`;

// Ensure the images directory exists
const ensureImagesDirExists = async () => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(IMAGES_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
      console.log('✅ Created medicine images directory:', IMAGES_DIR);
    }
  } catch (error) {
    console.error('❌ Error creating images directory:', error);
    throw error;
  }
};

// Generate unique filename for image
const generateImageFilename = (originalUri) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  const extension = originalUri.split('.').pop() || 'jpg';
  return `medicine_${timestamp}_${random}.${extension}`;
};

// Copy image from temporary location to permanent storage
export const saveImagePermanently = async (tempUri) => {
  try {
    await ensureImagesDirExists();
    
    // Generate unique filename
    const filename = generateImageFilename(tempUri);
    const permanentUri = `${IMAGES_DIR}${filename}`;
    
    // Copy the image to permanent storage
    await FileSystem.copyAsync({
      from: tempUri,
      to: permanentUri
    });
    
    console.log('✅ Image saved permanently:', filename);
    return permanentUri;
  } catch (error) {
    console.error('❌ Error saving image permanently:', error);
    throw error;
  }
};

// Save multiple images permanently
export const saveImagesPermanently = async (tempUris) => {
  try {
    const permanentUris = [];
    
    for (const tempUri of tempUris) {
      const permanentUri = await saveImagePermanently(tempUri);
      permanentUris.push(permanentUri);
    }
    
    return permanentUris;
  } catch (error) {
    console.error('❌ Error saving multiple images:', error);
    throw error;
  }
};

// Delete image from permanent storage
export const deleteImage = async (imageUri) => {
  try {
    if (!imageUri || !imageUri.includes(IMAGES_DIR)) {
      console.log('⚠️ Skipping delete - not a permanent image:', imageUri);
      return true;
    }
    
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(imageUri);
      console.log('✅ Deleted image:', imageUri);
    } else {
      console.log('⚠️ Image file does not exist:', imageUri);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error deleting image:', error);
    return false;
  }
};

// Delete multiple images from permanent storage
export const deleteImages = async (imageUris) => {
  try {
    const deletePromises = imageUris.map(uri => deleteImage(uri));
    await Promise.all(deletePromises);
    console.log('✅ Deleted multiple images:', imageUris.length);
    return true;
  } catch (error) {
    console.error('❌ Error deleting multiple images:', error);
    return false;
  }
};

// Check if image exists in permanent storage
export const imageExists = async (imageUri) => {
  try {
    if (!imageUri || !imageUri.includes(IMAGES_DIR)) {
      return false;
    }
    
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    return fileInfo.exists;
  } catch (error) {
    console.error('❌ Error checking image existence:', error);
    return false;
  }
};

// Get image size information
export const getImageInfo = async (imageUri) => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    return fileInfo;
  } catch (error) {
    console.error('❌ Error getting image info:', error);
    return null;
  }
};

// Clean up orphaned images (images not referenced by any medicine)
export const cleanupOrphanedImages = async (allMedicineImages) => {
  try {
    await ensureImagesDirExists();
    
    // Get all images in the directory
    const filesInDir = await FileSystem.readDirectoryAsync(IMAGES_DIR);
    
    // Create a set of all referenced images for fast lookup
    const referencedImages = new Set();
    allMedicineImages.forEach(medicineImages => {
      medicineImages.forEach(imageUri => {
        const filename = imageUri.split('/').pop();
        referencedImages.add(filename);
      });
    });
    
    // Delete orphaned images
    let deletedCount = 0;
    for (const filename of filesInDir) {
      if (!referencedImages.has(filename)) {
        const filePath = `${IMAGES_DIR}${filename}`;
        await FileSystem.deleteAsync(filePath);
        deletedCount++;
        console.log('🗑️ Deleted orphaned image:', filename);
      }
    }
    
    console.log(`✅ Cleanup complete. Deleted ${deletedCount} orphaned images.`);
    return deletedCount;
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    return 0;
  }
};

// Validate image URI format
export const isValidImageUri = (uri) => {
  if (!uri || typeof uri !== 'string') {
    return false;
  }
  
  // Check if it's a proper file URI
  return uri.startsWith('file://') || uri.includes(IMAGES_DIR);
};

// Convert old temporary URIs to permanent storage (migration helper)
export const migrateOldImages = async (oldImageUris) => {
  try {
    const newImageUris = [];
    
    for (const oldUri of oldImageUris) {
      try {
        // Check if image still exists and is accessible
        const fileInfo = await FileSystem.getInfoAsync(oldUri);
        if (fileInfo.exists) {
          // Copy to permanent storage
          const newUri = await saveImagePermanently(oldUri);
          newImageUris.push(newUri);
        } else {
          console.warn('⚠️ Old image no longer exists:', oldUri);
        }
      } catch (error) {
        console.warn('⚠️ Could not migrate image:', oldUri, error);
      }
    }
    
    return newImageUris;
  } catch (error) {
    console.error('❌ Error migrating old images:', error);
    return [];
  }
}; 