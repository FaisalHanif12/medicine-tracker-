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

const { width } = Dimensions.get('window');

const AddMedicineScreen = ({ navigation }) => {
  const [category, setCategory] = useState('medicine'); // 'medicine' or 'desi_totka'
  const [medicineName, setMedicineName] = useState('');
  const [animalType, setAnimalType] = useState('');
  const [medicineDetails, setMedicineDetails] = useState('');
  const [howToMake, setHowToMake] = useState(''); // Only for Desi Totka
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { showAlert, AlertComponent } = useCustomAlert();

  const animalTypes = ['Cow', 'Goat', 'Hyfer', 'Buffalo', 'Sheep'];

  const validateForm = () => {
    const newErrors = {};

    if (!medicineName.trim()) {
      newErrors.medicineName = 'Name is required';
    }

    if (!animalType) {
      newErrors.animalType = 'Please select an animal type';
    }

    if (!medicineDetails.trim()) {
      newErrors.medicineDetails = 'Details are required';
    }

    if (category === 'desi_totka' && !howToMake.trim()) {
      newErrors.howToMake = 'How to make is required for Desi Totka';
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
        message: 'You can only add up to 3 images per entry.',
        confirmText: 'Got it',
      });
      return;
    }

    // Use gallery only for all platforms (camera removed due to stability issues)
    pickFromGallery();
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
      const entryData = {
        name: medicineName.trim(),
        animal: animalType,
        details: medicineDetails.trim(),
        images: images, // These will be converted to permanent storage in saveMedicine
        isFavorite: false,
        category: category, // Add category to distinguish between medicine and desi totka
        howToMake: category === 'desi_totka' ? howToMake.trim() : null, // Only for Desi Totka
      };

      console.log('📝 Saving entry with images:', images.length);
      await saveMedicine(entryData);

      showAlert({
        type: 'success',
        title: `🎉 ${category === 'medicine' ? 'Medicine' : 'Desi Totka'} Added Successfully!`,
        message: `Your ${category === 'medicine' ? 'medicine' : 'desi totka'} and images have been saved permanently.`,
        confirmText: 'Awesome!',
        onConfirm: () => {
          // Reset form
          setCategory('medicine');
          setMedicineName('');
          setAnimalType('');
          setMedicineDetails('');
          setHowToMake('');
          setImages([]);
          setErrors({});
          navigation.goBack();
        },
      });
    } catch (error) {
      console.error('❌ Save error:', error);
      showAlert({
        type: 'error',
        title: 'Save Failed',
        message: 'We couldn\'t save your entry. Please check your information and try again.',
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

  const renderCategorySelector = () => (
    <View style={styles.formGroup}>
      <Text style={styles.label}>📋 Category</Text>
      <View style={styles.categoryContainer}>
        <TouchableOpacity
          style={[
            styles.categoryButton,
            category === 'medicine' && styles.categoryButtonActive
          ]}
          onPress={() => setCategory('medicine')}
        >
          <Ionicons 
            name="medical" 
            size={20} 
            color={category === 'medicine' ? '#FFFFFF' : '#4A90E2'} 
          />
          <Text style={[
            styles.categoryButtonText,
            category === 'medicine' && styles.categoryButtonTextActive
          ]}>
            💊 Medicine
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.categoryButton,
            category === 'desi_totka' && styles.categoryButtonActive
          ]}
          onPress={() => setCategory('desi_totka')}
        >
          <Ionicons 
            name="leaf" 
            size={20} 
            color={category === 'desi_totka' ? '#FFFFFF' : '#10B981'} 
          />
          <Text style={[
            styles.categoryButtonText,
            category === 'desi_totka' && styles.categoryButtonTextActive
          ]}>
            🌿 Desi Totka
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Category Selector */}
        {renderCategorySelector()}

        {/* Entry Name */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            {category === 'medicine' ? '💊 Medicine Name' : '🌿 Totka Name'}
          </Text>
          <TextInput
            style={[styles.input, errors.medicineName && styles.inputError]}
            placeholder={category === 'medicine' ? "Enter medicine name" : "Enter totka name"}
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

        {/* Details */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            {category === 'medicine' ? '📝 Medicine Details' : '📝 Totka Details'}
          </Text>
          <TextInput
            style={[styles.textArea, errors.medicineDetails && styles.inputError]}
            placeholder={category === 'medicine' 
              ? "Enter dosage, purpose, side effects, etc." 
              : "Enter purpose, benefits, usage instructions, etc."
            }
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

        {/* How to Make - Only for Desi Totka */}
        {category === 'desi_totka' && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>🔧 How to Make</Text>
            <TextInput
              style={[styles.textArea, errors.howToMake && styles.inputError]}
              placeholder="Enter ingredients and preparation method..."
              value={howToMake}
              onChangeText={(text) => {
                setHowToMake(text);
                if (errors.howToMake) {
                  setErrors({ ...errors, howToMake: null });
                }
              }}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {errors.howToMake && (
              <Text style={styles.errorText}>{errors.howToMake}</Text>
            )}
          </View>
        )}

        {/* Images */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>📸 Images ({images.length}/3)</Text>
          
          <TouchableOpacity
            style={[styles.imagePickerButton, errors.images && styles.inputError]}
            onPress={showImagePicker}
            disabled={images.length >= 3}
          >
            <Ionicons
              name="images-outline"
              size={24}
              color={images.length >= 3 ? '#ccc' : '#4A90E2'}
            />
            <Text style={[styles.imagePickerText, images.length >= 3 && styles.disabledText]}>
              {images.length === 0 
                ? '🖼️ Add Photo (Gallery)' 
                : `🖼️ Add Photo (${3 - images.length} remaining)`
              }
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
              <Text style={styles.saveButtonText}>
                Save {category === 'medicine' ? 'Medicine' : 'Desi Totka'}
              </Text>
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
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E5E9',
    borderRadius: 12,
    padding: 5,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  categoryButtonActive: {
    backgroundColor: '#4A90E2',
  },
  categoryButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#4A90E2',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
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
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E5E9',
    borderRadius: 12,
    padding: 5,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  categoryButtonActive: {
    backgroundColor: '#4A90E2',
  },
  categoryButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
});

export default AddMedicineScreen; 