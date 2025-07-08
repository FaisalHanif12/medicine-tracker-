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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { deleteMedicine } from '../utils/storage';

const { width, height } = Dimensions.get('window');

const MedicineDetailScreen = ({ route, navigation }) => {
  const { medicine } = route.params;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageModalVisible, setImageModalVisible] = useState(false);

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
    Alert.alert(
      'Delete Medicine',
      'Are you sure you want to delete this medicine entry? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMedicine(medicine.id);
              Alert.alert('Success', 'Medicine deleted successfully', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete medicine');
            }
          },
        },
      ]
    );
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
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteMedicine}
          >
            <Ionicons name="trash-outline" size={24} color="#FF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Medicine Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Medicine Details</Text>
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsText}>{medicine.details}</Text>
        </View>
      </View>

      {/* Images Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          📸 Medicine Images ({medicine.images?.length || 0})
        </Text>
        
        {medicine.images && medicine.images.length > 0 ? (
          <View style={styles.imagesGrid}>
            {medicine.images.map((uri, index) => renderImage(uri, index))}
          </View>
        ) : (
          <View style={styles.noImagesContainer}>
            <Ionicons name="image-outline" size={60} color="#ccc" />
            <Text style={styles.noImagesText}>No images available</Text>
          </View>
        )}
      </View>

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
  },
  deleteButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FFE5E5',
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