import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
  StyleSheet,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import { deleteMedicine, updateMedicine } from '../utils/storage';
import { useCustomAlert } from '../components/CustomAlert';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';

const { width, height } = Dimensions.get('window');

const MedicineDetailScreen = ({ route, navigation }) => {
  const { medicine } = route.params;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMedicine, setEditedMedicine] = useState(medicine);
  const { showAlert, AlertComponent } = useCustomAlert();

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

  const openImageModal = (index) => {
    setSelectedImageIndex(index);
    setImageModalVisible(true);
  };

  const handleDeleteMedicine = () => {
    const entryType = medicine.category === 'medicine' ? 'Medicine' : 'Desi Totka';
    showAlert({
      type: 'confirm',
      title: `🗑️ Delete ${entryType}`,
      message: `Are you sure you want to delete this ${entryType.toLowerCase()} entry? This action cannot be undone.`,
      showCancel: true,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await deleteMedicine(medicine.id);
          showAlert({
            type: 'success',
            title: '✅ Deleted Successfully',
            message: 'Medicine has been removed from your database.',
            confirmText: 'OK',
            onConfirm: () => navigation.goBack(),
          });
        } catch (error) {
          showAlert({
            type: 'error',
            title: 'Delete Failed',
            message: 'We couldn\'t delete the medicine. Please try again.',
            confirmText: 'Try Again',
          });
        }
      },
    });
  };

  const handleEditMedicine = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedMedicine(medicine);
  };

  const handleSaveEdit = async () => {
    try {
      console.log('💾 Updating medicine with images:', editedMedicine.images?.length || 0);
      const updatedMedicine = await updateMedicine(medicine.id, editedMedicine);
      
      const entryType = medicine.category === 'medicine' ? 'Medicine' : 'Desi Totka';
      showAlert({
        type: 'success',
        title: '✅ Updated Successfully',
        message: `Your ${entryType.toLowerCase()} information and images have been saved permanently.`,
        confirmText: 'Great!',
        onConfirm: () => {
          setIsEditing(false);
          navigation.setParams({ medicine: updatedMedicine });
        },
      });
    } catch (error) {
      console.error('❌ Update error:', error);
      showAlert({
        type: 'error',
        title: 'Update Failed',
        message: 'We couldn\'t save your changes. Please try again.',
        confirmText: 'Try Again',
      });
    }
  };

  const handleAddImage = () => {
    if (editedMedicine.images && editedMedicine.images.length >= 3) {
      showAlert({
        type: 'warning',
        title: 'Image Limit Reached',
        message: 'You can only add up to 3 images per medicine.',
        confirmText: 'OK',
      });
      return;
    }

    // Use gallery only for all platforms (camera removed due to stability issues)
    pickFromGalleryEdit();
  };



  const pickFromGalleryEdit = async () => {
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
          const newImages = [...(editedMedicine.images || []), imageUri];
          setEditedMedicine(prev => ({ ...prev, images: newImages }));
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

  const handleRemoveImage = (index) => {
    const newImages = editedMedicine.images.filter((_, i) => i !== index);
    setEditedMedicine(prev => ({ ...prev, images: newImages }));
  };

  const renderImage = (uri, index) => (
    <TouchableOpacity
      key={index}
      style={styles.imageContainer}
      onPress={() => openImageModal(index)}
      activeOpacity={0.8}
    >
      <Image source={{ uri }} style={styles.medicineImage} />
      <View style={styles.imageOverlay}>
        <Ionicons name="expand-outline" size={24} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.medicineName}>{medicine.name}</Text>
          <View style={styles.animalBadge}>
            <Text style={styles.animalText}>
              {getAnimalIcon(medicine.animal)} {medicine.animal}
            </Text>
          </View>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {isEditing ? (
            <>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelEdit}
              >
                <Ionicons name="close-outline" size={24} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveEdit}
              >
                <Ionicons name="checkmark-outline" size={24} color="#10B981" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEditMedicine}
              >
                <Ionicons name="create-outline" size={24} color="#3B82F6" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeleteMedicine}
              >
                <Ionicons name="trash-outline" size={24} color="#EF4444" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Medicine Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {medicine.category === 'medicine' ? '📝 Medicine Details' : '🌿 Totka Details'}
        </Text>
        {isEditing ? (
          <View style={styles.editContainer}>
            <Text style={styles.editLabel}>Medicine Name</Text>
            <TextInput
              style={styles.editInput}
              value={editedMedicine.name}
              onChangeText={(text) => setEditedMedicine(prev => ({ ...prev, name: text }))}
              placeholder="Enter medicine name"
            />
            
            <Text style={styles.editLabel}>Animal Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={editedMedicine.animal}
                onValueChange={(value) => setEditedMedicine(prev => ({ ...prev, animal: value }))}
                style={styles.picker}
              >
                <Picker.Item label="Cow" value="Cow" />
                <Picker.Item label="Goat" value="Goat" />
                <Picker.Item label="Hyfer" value="Hyfer" />
                <Picker.Item label="Buffalo" value="Buffalo" />
                <Picker.Item label="Sheep" value="Sheep" />
              </Picker>
            </View>
            
            <Text style={styles.editLabel}>Medicine Details</Text>
            <TextInput
              style={styles.editTextArea}
              value={editedMedicine.details}
              onChangeText={(text) => setEditedMedicine(prev => ({ ...prev, details: text }))}
              placeholder="Enter dosage, purpose, side effects, etc."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        ) : (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsText}>{medicine.details}</Text>
          </View>
        )}
        
        {/* How to Make Section - Only for Desi Totka */}
        {medicine.category === 'desi_totka' && medicine.howToMake && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔧 How to Make</Text>
            {isEditing ? (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Enter ingredients and preparation method..."
                  value={editedMedicine.howToMake}
                  onChangeText={(text) => setEditedMedicine({ ...editedMedicine, howToMake: text })}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            ) : (
              <View style={styles.detailsContainer}>
                <Text style={styles.detailsText}>{medicine.howToMake}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Images Section - Only for Medicine */}
      {medicine.category === 'medicine' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            📸 Medicine Images ({isEditing ? editedMedicine.images?.length || 0 : medicine.images?.length || 0})
          </Text>
          
          {isEditing && (
            <TouchableOpacity
              style={styles.addImageButton}
              onPress={handleAddImage}
            >
              <Ionicons name="add-circle-outline" size={20} color="#3B82F6" />
              <Text style={styles.addImageText}>🖼️ Add Photo (Gallery)</Text>
            </TouchableOpacity>
          )}
          
          {(isEditing ? editedMedicine.images : medicine.images) && (isEditing ? editedMedicine.images : medicine.images).length > 0 ? (
            <View style={styles.imagesGrid}>
              {(isEditing ? editedMedicine.images : medicine.images).map((uri, index) => (
                <View key={index} style={styles.imageContainer}>
                  <TouchableOpacity
                    onPress={() => openImageModal(index)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri }} style={styles.medicineImage} />
                    <View style={styles.imageOverlay}>
                      <Ionicons name="expand-outline" size={24} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                  {isEditing && (
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => handleRemoveImage(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noImagesContainer}>
              <Ionicons name="image-outline" size={60} color="#ccc" />
              <Text style={styles.noImagesText}>No images available</Text>
            </View>
          )}
        </View>
      )}

      {/* Desi Totka Info Section */}
      {medicine.category === 'desi_totka' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌿 Traditional Remedy Info</Text>
          <View style={styles.desiTotkaInfoContainer}>
            <FontAwesome5 name="leaf" size={40} color="#10B981" />
            <Text style={styles.desiTotkaInfoText}>
              This is a traditional home remedy (Desi Totka) that doesn't require images.
            </Text>
          </View>
        </View>
      )}

      {/* Medicine Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ Additional Information</Text>
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Added Date:</Text>
            <Text style={styles.infoValue}>
              {new Date(medicine.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Added Time:</Text>
            <Text style={styles.infoValue}>
              {new Date(medicine.createdAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Medicine ID:</Text>
            <Text style={styles.infoValue}>{medicine.id}</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomSpacing} />

      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackground}
            onPress={() => setImageModalVisible(false)}
          >
            <View style={styles.modalContent}>
              {medicine.images && medicine.images[selectedImageIndex] && (
                <Image
                  source={{ uri: medicine.images[selectedImageIndex] }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              )}
              
              {/* Navigation Arrows */}
              {medicine.images && medicine.images.length > 1 && (
                <>
                  {selectedImageIndex > 0 && (
                    <TouchableOpacity
                      style={[styles.navButton, styles.prevButton]}
                      onPress={() => setSelectedImageIndex(selectedImageIndex - 1)}
                    >
                      <Ionicons name="chevron-back" size={30} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                  
                  {selectedImageIndex < medicine.images.length - 1 && (
                    <TouchableOpacity
                      style={[styles.navButton, styles.nextButton]}
                      onPress={() => setSelectedImageIndex(selectedImageIndex + 1)}
                    >
                      <Ionicons name="chevron-forward" size={30} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                </>
              )}

              {/* Image Counter */}
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>
                  {selectedImageIndex + 1} of {medicine.images?.length || 0}
                </Text>
              </View>

              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setImageModalVisible(false)}
              >
                <Ionicons name="close" size={30} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
      <AlertComponent />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flex: 1,
  },
  medicineName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  animalBadge: {
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  animalText: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '600',
  },
  actionButtons: {
    marginLeft: 15,
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  deleteButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  saveButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
  },
  cancelButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 15,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  detailsContainer: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  detailsText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  editContainer: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  editLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 15,
  },
  editInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  editTextArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    height: 100,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  addImageText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  imageContainer: {
    position: 'relative',
    width: (width - 90) / 2,
    height: (width - 90) / 2,
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  medicineImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 8,
  },
  noImagesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noImagesText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
  desiTotkaInfoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    marginTop: 10,
  },
  desiTotkaInfoText: {
    fontSize: 16,
    color: '#10B981',
    textAlign: 'center',
    marginTop: 15,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  infoContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  bottomSpacing: {
    height: 30,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    position: 'relative',
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: width * 0.95,
    height: height * 0.8,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    padding: 15,
    marginTop: -25,
  },
  prevButton: {
    left: 20,
  },
  nextButton: {
    right: 20,
  },
  imageCounter: {
    position: 'absolute',
    bottom: 100,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  imageCounterText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    padding: 15,
  },
});

export default MedicineDetailScreen; 