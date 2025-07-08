import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getMedicines } from '../utils/storage';

const { width } = Dimensions.get('window');

const ViewMedicinesScreen = ({ navigation }) => {
  const [medicines, setMedicines] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadMedicines = async () => {
    try {
      const medicineData = await getMedicines();
      setMedicines(medicineData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load medicines');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMedicines();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadMedicines();
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

  const navigateToDetail = (medicine) => {
    navigation.navigate('MedicineDetail', { medicine });
  };

  const renderMedicineCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigateToDetail(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardImageContainer}>
        {item.images && item.images.length > 0 ? (
          <Image source={{ uri: item.images[0] }} style={styles.cardImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="medical-outline" size={40} color="#ccc" />
          </View>
        )}
        <View style={styles.imageOverlay}>
          <Text style={styles.imageCount}>
            {item.images ? item.images.length : 0} 📸
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.medicineName} numberOfLines={2}>
          {item.name}
        </Text>
        
        <View style={styles.animalContainer}>
          <Text style={styles.animalType}>
            {getAnimalIcon(item.animal)} {item.animal}
          </Text>
        </View>

        <Text style={styles.medicineDetails} numberOfLines={3}>
          {item.details}
        </Text>

        <View style={styles.cardFooter}>
          <Text style={styles.addedDate}>
            Added: {new Date(item.createdAt).toLocaleDateString()}
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#4A90E2" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="medical-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No Medicines Added</Text>
      <Text style={styles.emptySubtitle}>
        Start by adding your first medicine entry
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('AddMedicine')}
      >
        <Ionicons name="add-outline" size={24} color="#FFFFFF" />
        <Text style={styles.emptyButtonText}>Add Medicine</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="medical-outline" size={60} color="#4A90E2" />
        <Text style={styles.loadingText}>Loading Medicines...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {medicines.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {medicines.length} Medicine{medicines.length !== 1 ? 's' : ''} Recorded
            </Text>
            <Text style={styles.headerSubtitle}>
              Swipe horizontally to browse
            </Text>
          </View>

          <FlatList
            data={medicines}
            renderItem={renderMedicineCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            snapToInterval={width * 0.85}
            snapToAlignment="start"
            decelerationRate="fast"
          />
        </>
      )}

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddMedicine')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  listContainer: {
    paddingHorizontal: 10,
  },
  card: {
    width: width * 0.8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  cardImageContainer: {
    position: 'relative',
    height: 200,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  cardContent: {
    padding: 20,
  },
  medicineName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  animalContainer: {
    marginBottom: 12,
  },
  animalType: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '600',
  },
  medicineDetails: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  addedDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  emptyButton: {
    backgroundColor: '#4A90E2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default ViewMedicinesScreen; 