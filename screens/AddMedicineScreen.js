import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { saveMedicine } from '../utils/storage';
import { useCustomAlert } from '../components/CustomAlert';
import * as Device from 'expo-device';

const { width } = Dimensions.get('window');

const AddMedicineScreen = ({ navigation }) => {
  const [medicineName, setMedicineName] = useState('');
  const [animalType, setAnimalType] = useState('');
  const [medicineDetails, setMedicineDetails] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { showAlert, AlertComponent } = useCustomAlert();

  const animalTypes = ['Cow', 'Goat', 'Hyfer', 'Buffalo', 'Sheep'];

  const validateForm = () => {
    const newErrors = {};

    if (!medicineName.trim()) {
      newErrors.medicineName = 'Medicine name is required';
    }

    if (!animalType) {
      newErrors.animalType = 'Please select an animal type';
    }

    if (!medicineDetails.trim()) {
      newErrors.medicineDetails = 'Medicine details are required';
    }

    if (images.length === 0) {
      newErrors.images = 'Please add at least one image';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Device info for debugging
  const showDeviceInfo = () => {
    const deviceInfo = {
      Platform: Platform.OS,
      Brand: Device.brand,
      Model: Device.modelName,
      OS_Version: Device.osVersion,
      Device_Type: Device.deviceType,
      Is_Device: Device.isDevice,
      Screen_Dimensions: `${width}x${Dimensions.get('window').height}`,
      Expo_SDK: '53.0.17'
    };

    console.log('📱 DEVICE INFO:', deviceInfo);
    
    showAlert({
      type: 'info',
      title: '📱 Device Information',
      message: Object.entries(deviceInfo)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n'),
      confirmText: 'Test Camera',
      showCancel: true,
      cancelText: 'Close',
      onConfirm: () => testCameraOnly(),
    });
  };

  // Test function to help diagnose camera issues
  const testCameraOnly = async () => {
    try {
      if (Platform.OS === 'web') {
        showAlert({
          type: 'info',
          title: '🧪 Camera Test',
          message: 'Camera testing is not available on web platform.',
          confirmText: 'OK',
        });
        return;
      }

      console.log('🧪 CAMERA TEST STARTING...');
      
      showAlert({
        type: 'info',
        title: '🧪 Starting Camera Test',
        message: 'Testing camera with minimal settings. Watch for crashes or errors.',
        confirmText: 'Continue',
        onConfirm: async () => {
          try {
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: false, // Disable editing to simplify
              quality: 0.3, // Very low quality for testing
            });
            
            console.log('🧪 CAMERA TEST RESULT:', result);
            console.log('🧪 Test completed without crash!');
            
            showAlert({
              type: 'success',
              title: '🧪 Camera Test Success!',
              message: `Test completed!\nCanceled: ${result.canceled}\nAssets: ${result.assets ? result.assets.length : 'none'}\n\nCamera hardware works! Issue might be in image processing.`,
              confirmText: 'Show Details',
              onConfirm: () => {
                showAlert({
                  type: 'info',
                  title: '🧪 Test Details',
                  message: `Full result: ${JSON.stringify(result, null, 2)}`,
                  confirmText: 'OK',
                });
              },
            });
          } catch (testError) {
            console.error('🧪 CAMERA TEST FAILED:', testError);
            showAlert({
              type: 'error',
              title: '🧪 Camera Test Failed',
              message: `Camera test crashed!\nError: ${testError.name}\nMessage: ${testError.message}\n\nThis confirms camera hardware issue.`,
              confirmText: 'Show Error',
              onConfirm: () => {
                showAlert({
                  type: 'error',
                  title: '🧪 Full Test Error',
                  message: `${JSON.stringify(testError, Object.getOwnPropertyNames(testError), 2)}`,
                  confirmText: 'OK',
                });
              },
            });
          }
        },
      });
    } catch (error) {
      console.error('🧪 TEST SETUP ERROR:', error);
      showAlert({
        type: 'error',
        title: '🧪 Test Setup Failed',
        message: `Couldn't even start test: ${error.message}`,
        confirmText: 'OK',
      });
    }
  };

    const showImagePicker = () => {
    if (images.length >= 3) {
      showAlert({
        type: 'warning',
        title: 'Image Limit Reached',
        message: 'You can only add up to 3 images per medicine.',
        confirmText: 'Got it',
      });
      return;
    }

    // Web-specific behavior - only show gallery option
    if (Platform.OS === 'web') {
      pickFromGallery();
      return;
    }

    // Mobile behavior - show both camera and gallery options
    showAlert({
      type: 'info',
      title: '📸 Add Photo',
      message: 'How would you like to add a photo?',
      showCancel: true,
      confirmText: '📷 Take Photo',
      cancelText: '🖼️ Choose from Gallery',
      onConfirm: () => takePhoto(),
      onCancel: () => pickFromGallery(),
    });
  };

  const takePhoto = async () => {
    try {
      // Web compatibility check
      if (Platform.OS === 'web') {
        showAlert({
          type: 'info',
          title: '📱 Camera Not Available',
          message: 'Camera functionality is not available on web. Please use the gallery option to upload images.',
          confirmText: 'OK',
        });
        return;
      }

      // Show initial debug alert
      console.log('🚀 TAKE PHOTO FUNCTION STARTED');
      showAlert({
        type: 'info',
        title: '🚀 Camera Function Started',
        message: 'takePhoto() function has been called. Watch for when/where the app crashes.',
        confirmText: 'Continue',
        onConfirm: async () => {
          await proceedWithCamera();
        },
      });
    } catch (error) {
      console.error('❌ ERROR IN TAKE PHOTO WRAPPER:', error);
      showAlert({
        type: 'error',
        title: '❌ Take Photo Wrapper Error',
        message: `Error occurred before camera launch: ${error.message}`,
        confirmText: 'OK',
      });
    }
  };

  const proceedWithCamera = async () => {
    try {
      console.log('🔍 CHECKING CAMERA PERMISSIONS...');

      // Check current camera permissions
      const { status: currentStatus } = await ImagePicker.getCameraPermissionsAsync();
      
      console.log('🔍 CURRENT PERMISSION STATUS:', currentStatus);

      if (currentStatus === 'granted') {
        console.log('✅ PERMISSIONS GRANTED, LAUNCHING CAMERA...');
        // Permissions already granted, proceed with camera
        await launchCamera();
      } else {
        console.log('🚫 PERMISSIONS NOT GRANTED, REQUESTING...');
        // Need to request permissions with custom alert first
        showAlert({
          type: 'info',
          title: '📷 Camera Access Required',
          message: 'We need access to your camera to take photos of medicines. This helps you document your animal care records.',
          confirmText: 'Grant Access',
          showCancel: true,
          cancelText: 'Not Now',
          onConfirm: async () => {
            console.log('🔑 REQUESTING CAMERA PERMISSIONS...');
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            console.log('🔑 PERMISSION REQUEST RESULT:', status);
            
            if (status === 'granted') {
              console.log('✅ PERMISSION GRANTED, LAUNCHING CAMERA...');
              await launchCamera();
            } else {
              console.log('❌ PERMISSION DENIED');
              showAlert({
                type: 'warning',
                title: '⚠️ Permission Denied',
                message: 'Camera access is required to take photos. You can enable it manually in your device settings under App Permissions.',
                confirmText: 'OK',
              });
            }
          },
        });
      }
    } catch (error) {
      console.error('❌ ERROR IN PROCEED WITH CAMERA:', error);
      showAlert({
        type: 'error',
        title: '❌ Camera Permission Error',
        message: `Error during permission check: ${error.message}`,
        confirmText: 'Try Again',
      });
    }
  };

  const launchCamera = async () => {
    try {
      // Terminal and mobile logging
      const log = (message, data = null) => {
        console.log(message, data || '');
        // Also show critical steps as alerts for mobile debugging
        if (message.includes('📸 Starting') || message.includes('📸 Camera result') || message.includes('📸 Image successfully')) {
          showAlert({
            type: 'info',
            title: 'Debug Log',
            message: `${message}${data ? ` - ${JSON.stringify(data, null, 2)}` : ''}`,
            confirmText: 'Continue',
          });
        }
      };

      log('📸 Starting camera launch...');
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7, // Reduced quality to prevent memory issues
        base64: false,
        exif: false,
        allowsMultipleSelection: false,
      });

      log('📸 Camera result received:', {
        canceled: result.canceled,
        assets: result.assets ? result.assets.length : 0,
        hasAssets: !!(result.assets && result.assets.length > 0)
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        log('📸 Image asset details:', {
          uri: asset.uri ? asset.uri.substring(0, 50) + '...' : 'No URI',
          width: asset.width,
          height: asset.height,
          type: asset.type
        });
        
        if (asset && asset.uri) {
          log('📸 Adding image to state...');
          setImages(prevImages => {
            const newImages = [...prevImages, asset.uri];
            log('📸 Images array updated:', `Total images: ${newImages.length}`);
            return newImages;
          });
          
          // Clear image error if exists
          if (errors.images) {
            setErrors(prevErrors => ({ ...prevErrors, images: null }));
          }
          
          log('📸 Image successfully added!');
          showAlert({
            type: 'success',
            title: '📸 Photo Captured!',
            message: `Photo added successfully!\nURI: ${asset.uri.substring(0, 50)}...\nSize: ${asset.width}x${asset.height}`,
            confirmText: 'Great!',
          });
        } else {
          console.error('📸 Invalid asset or URI:', asset);
          showAlert({
            type: 'error',
            title: 'Photo Processing Failed',
            message: `Asset details: ${JSON.stringify(asset, null, 2)}`,
            confirmText: 'OK',
          });
        }
      } else {
        log('📸 Camera was canceled or no assets', {
          canceled: result.canceled,
          assetsLength: result.assets ? result.assets.length : 'undefined'
        });
        
        showAlert({
          type: 'info',
          title: 'Camera Result',
          message: `Canceled: ${result.canceled}\nAssets: ${result.assets ? result.assets.length : 'undefined'}`,
          confirmText: 'OK',
        });
      }
    } catch (error) {
      console.error('📸 CAMERA ERROR DETAILS:');
      console.error('📸 Error message:', error.message);
      console.error('📸 Error name:', error.name);
      console.error('📸 Error stack:', error.stack);
      console.error('📸 Full error object:', error);
      
      showAlert({
        type: 'error',
        title: 'Camera Error Details',
        message: `Error Name: ${error.name}\nMessage: ${error.message}\nStack: ${error.stack ? error.stack.substring(0, 200) + '...' : 'No stack trace'}`,
        confirmText: 'Show Console',
        onConfirm: () => {
          // Show additional error details
          showAlert({
            type: 'error',
            title: 'Full Error Details',
            message: `Full Error: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`,
            confirmText: 'OK',
          });
        },
      });
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
        exif: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        if (imageUri) {
          setImages([...images, imageUri]);
          // Clear image error if exists
          if (errors.images) {
            setErrors({ ...errors, images: null });
          }
        } else {
          showAlert({
            type: 'warning',
            title: 'Image Issue',
            message: 'The image was selected but couldn\'t be processed. Please try again.',
            confirmText: 'OK',
          });
        }
      }
    } catch (error) {
      console.error('Gallery error:', error);
      showAlert({
        type: 'error',
        title: 'Gallery Error',
        message: 'We couldn\'t access your gallery. Please try again.',
        confirmText: 'Try Again',
      });
    }
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const medicineData = {
        name: medicineName.trim(),
        animal: animalType,
        details: medicineDetails.trim(),
        images: images,
        isFavorite: false,
      };

      await saveMedicine(medicineData);

      showAlert({
        type: 'success',
        title: '🎉 Medicine Added Successfully!',
        message: 'Your medicine has been saved to the database.',
        confirmText: 'Awesome!',
        onConfirm: () => {
          // Reset form
          setMedicineName('');
          setAnimalType('');
          setMedicineDetails('');
          setImages([]);
          setErrors({});
          navigation.goBack();
        },
      });
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Save Failed',
        message: 'We couldn\'t save your medicine. Please check your information and try again.',
        confirmText: 'Try Again',
      });
    }

    setLoading(false);
  };

  const getAnimalIcon = (animal) => {
    switch (animal) {
      case 'Cow': return '🐄';
      case 'Goat': return '🐐';
      case 'Hyfer': return '🐄';
      case 'Buffalo': return '🐃';
      case 'Sheep': return '🐑';
      default: return '🐄';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Medicine Name */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>💊 Medicine Name</Text>
          <TextInput
            style={[styles.input, errors.medicineName && styles.inputError]}
            placeholder="Enter medicine name"
            value={medicineName}
            onChangeText={(text) => {
              setMedicineName(text);
              if (errors.medicineName) {
                setErrors({ ...errors, medicineName: null });
              }
            }}
          />
          {errors.medicineName && (
            <Text style={styles.errorText}>{errors.medicineName}</Text>
          )}
        </View>

        {/* Animal Type */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>🐄 Animal Type</Text>
          <View style={[styles.pickerContainer, errors.animalType && styles.inputError]}>
            <Picker
              selectedValue={animalType}
              style={styles.picker}
              onValueChange={(value) => {
                setAnimalType(value);
                if (errors.animalType) {
                  setErrors({ ...errors, animalType: null });
                }
              }}
            >
              <Picker.Item label="Select animal type" value="" />
              {animalTypes.map((animal) => (
                <Picker.Item
                  key={animal}
                  label={`${getAnimalIcon(animal)} ${animal}`}
                  value={animal}
                />
              ))}
            </Picker>
          </View>
          {errors.animalType && (
            <Text style={styles.errorText}>{errors.animalType}</Text>
          )}
        </View>

        {/* Medicine Details */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>📝 Medicine Details</Text>
          <TextInput
            style={[styles.textArea, errors.medicineDetails && styles.inputError]}
            placeholder="Enter dosage, purpose, side effects, etc."
            value={medicineDetails}
            onChangeText={(text) => {
              setMedicineDetails(text);
              if (errors.medicineDetails) {
                setErrors({ ...errors, medicineDetails: null });
              }
            }}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          {errors.medicineDetails && (
            <Text style={styles.errorText}>{errors.medicineDetails}</Text>
          )}
        </View>

        {/* Images */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>📸 Medicine Images ({images.length}/3)</Text>
          
          <TouchableOpacity
            style={[styles.imagePickerButton, errors.images && styles.inputError]}
            onPress={showImagePicker}
            disabled={images.length >= 3}
          >
            <Ionicons
              name="camera-outline"
              size={24}
              color={images.length >= 3 ? '#ccc' : '#4A90E2'}
            />
            <Text style={[styles.imagePickerText, images.length >= 3 && styles.disabledText]}>
              {images.length === 0 
                ? Platform.OS === 'web' 
                  ? '🖼️ Add Photo (Gallery)' 
                  : '📸 Add Photo (Camera/Gallery)'
                : `📸 Add Photo (${3 - images.length} remaining)`
              }
            </Text>
          </TouchableOpacity>

          {/* Debug Test Button - Remove after testing, Mobile only */}
          {Platform.OS !== 'web' && (
            <TouchableOpacity
              style={styles.testButton}
              onPress={showDeviceInfo}
            >
              <Ionicons name="bug-outline" size={20} color="#FF6B6B" />
              <Text style={styles.testButtonText}>🧪 Debug Camera Issue</Text>
            </TouchableOpacity>
          )}

          {errors.images && (
            <Text style={styles.errorText}>{errors.images}</Text>
          )}

          {/* Image Preview */}
          {images.length > 0 && (
            <View style={styles.imagePreviewContainer}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imagePreview}>
                  <Image source={{ uri }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.disabledButton]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="save-outline" size={24} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save Medicine</Text>
            </>
          )}
        </TouchableOpacity>
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
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E5E9',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#FF4444',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E5E9',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#333',
    height: 100,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E5E9',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    marginTop: 5,
  },
  imagePickerButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E5E9',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '500',
  },
  disabledText: {
    color: '#ccc',
  },
  testButton: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFE5E5',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  testButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 15,
  },
  imagePreview: {
    position: 'relative',
    marginRight: 15,
    marginBottom: 15,
  },
  previewImage: {
    width: (width - 60) / 3,
    height: (width - 60) / 3,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  saveButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
});

export default AddMedicineScreen; 