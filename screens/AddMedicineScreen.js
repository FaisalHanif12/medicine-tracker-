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
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { saveMedicine } from '../utils/storage';
import { useCustomAlert } from '../components/CustomAlert';

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
      // Check current camera permissions
      const { status: currentStatus } = await ImagePicker.getCameraPermissionsAsync();
      
      if (currentStatus === 'granted') {
        // Permissions already granted, proceed with camera
        await launchCamera();
      } else {
        // Need to request permissions with custom alert first
        showAlert({
          type: 'info',
          title: '📷 Camera Access Required',
          message: 'We need access to your camera to take photos of medicines. This helps you document your animal care records.',
          confirmText: 'Grant Access',
          showCancel: true,
          cancelText: 'Not Now',
          onConfirm: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            
            if (status === 'granted') {
              await launchCamera();
            } else {
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
      showAlert({
        type: 'error',
        title: 'Camera Error',
        message: 'We couldn\'t access the camera. Please try again.',
        confirmText: 'Try Again',
      });
    }
  };

  const launchCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
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
          
          showAlert({
            type: 'success',
            title: '📸 Photo Captured!',
            message: 'Your photo has been added successfully.',
            confirmText: 'Great!',
          });
        } else {
          showAlert({
            type: 'warning',
            title: 'Photo Issue',
            message: 'The photo was taken but couldn\'t be processed. Please try again.',
            confirmText: 'OK',
          });
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
      showAlert({
        type: 'error',
        title: 'Camera Error',
        message: 'We couldn\'t take the photo. Please try again.',
        confirmText: 'Try Again',
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
              {images.length === 0 ? '📸 Add Photo (Camera/Gallery)' : `📸 Add Photo (${3 - images.length} remaining)`}
            </Text>
          </TouchableOpacity>

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