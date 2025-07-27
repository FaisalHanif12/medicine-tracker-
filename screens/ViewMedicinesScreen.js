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
  ScrollView,
  StatusBar,
  Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { getMedicines, toggleFavorite } from '../utils/storage';
import { useCustomAlert } from '../components/CustomAlert';

const { width } = Dimensions.get('window');

const ViewMedicinesScreen = ({ navigation }) => {
  const [medicines, setMedicines] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All'); // 'All', 'medicine', 'desi_totka'
  const scrollY = new Animated.Value(0);
  const { showAlert, AlertComponent } = useCustomAlert();

  const loadMedicines = async () => {
    try {
      const medicineData = await getMedicines();
      setMedicines(medicineData);
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Loading Error',
        message: 'We couldn\'t load your medicines right now. Please check your connection and try again.',
        confirmText: 'Retry',
        onConfirm: () => loadMedicines(),
      });
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
      case 'Cow': return { emoji: '🐄', icon: 'cow', color: '#8B4513' };
      case 'Goat': return { emoji: '🐐', icon: 'sheep', color: '#DEB887' };
      case 'Hyfer': return { emoji: '🐄', icon: 'cow', color: '#A0522D' };
      case 'Buffalo': return { emoji: '🐃', icon: 'cow', color: '#2F4F4F' };
      case 'Sheep': return { emoji: '🐑', icon: 'sheep', color: '#F5F5DC' };
      default: return { emoji: '🐄', icon: 'cow', color: '#8B4513' };
    }
  };

  const getAnimalCategories = () => {
    const categories = ['All', ...new Set(medicines.map(m => m.animal))];
    return categories;
  };

  const getFilteredMedicines = () => {
    let filtered = medicines;
    
    // Filter by type (Medicine/Desi Totka)
    if (selectedType !== 'All') {
      filtered = filtered.filter(m => m.category === selectedType);
    }
    
    // Filter by animal category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(m => m.animal === selectedCategory);
    }
    
    return filtered;
  };

  const navigateToDetail = (medicine) => {
    navigation.navigate('MedicineDetail', { medicine });
  };

  const handleToggleFavorite = async (medicineId) => {
    try {
      const updatedMedicine = await toggleFavorite(medicineId);
      const updatedMedicines = medicines.map(med => 
        med.id === medicineId ? updatedMedicine : med
      );
      setMedicines(updatedMedicines);
      
      showAlert({
        type: 'success',
        title: updatedMedicine.isFavorite ? '❤️ Added to Favorites!' : '💔 Removed from Favorites',
        message: updatedMedicine.isFavorite 
          ? `${updatedMedicine.name} has been added to your favorites list.`
          : `${updatedMedicine.name} has been removed from your favorites.`,
        confirmText: 'Great!',
      });
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Oops! Something went wrong',
        message: 'We couldn\'t update your favorites right now. Please try again.',
        confirmText: 'Try Again',
      });
    }
  };

  const getMedicineStats = () => {
    const total = medicines.length;
    const animals = new Set(medicines.map(m => m.animal)).size;
    const recentCount = medicines.filter(m => {
      const daysDiff = (new Date() - new Date(m.createdAt)) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    }).length;
    
    // Category stats
    const medicinesCount = medicines.filter(m => m.category === 'medicine').length;
    const desiTotkaCount = medicines.filter(m => m.category === 'desi_totka').length;
    
    return { total, animals, recent: recentCount, medicinesCount, desiTotkaCount };
  };

  const renderMedicineCard = ({ item, index }) => {
    const animalData = getAnimalIcon(item.animal);
    const isEven = index % 2 === 0;
    
    return (
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            transform: [{
              translateY: scrollY.interpolate({
                inputRange: [-1, 0, index * 280, (index + 1) * 280],
                outputRange: [0, 0, 0, -50],
                extrapolateLeft: 'clamp',
              })
            }]
          }
        ]}
      >
        <TouchableOpacity
          style={[styles.modernCard, isEven ? styles.cardLeft : styles.cardRight]}
          onPress={() => navigateToDetail(item)}
          activeOpacity={0.95}
        >
          {/* Card Header with Gradient */}
          <View style={[styles.cardHeader, { backgroundColor: animalData.color + '20' }]}>
            <View style={styles.cardHeaderContent}>
              <View style={[styles.animalIconContainer, { backgroundColor: animalData.color }]}>
                <Text style={styles.animalEmoji}>{animalData.emoji}</Text>
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.animalTypeModern}>{item.animal}</Text>
                <Text style={styles.medicineCount}>
                  {item.images?.length || 0} photos
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.cardActions}
                onPress={(e) => {
                  e.stopPropagation();
                  handleToggleFavorite(item.id);
                }}
                activeOpacity={0.7}
              >
                <MaterialIcons 
                  name={item.isFavorite ? "favorite" : "favorite-border"} 
                  size={20} 
                  color={item.isFavorite ? "#FF6B9D" : "#D1D5DB"} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Image with Overlay */}
          <View style={styles.cardImageContainer}>
            {item.images && item.images.length > 0 ? (
              <>
                <Image source={{ uri: item.images[0] }} style={styles.modernCardImage} />
                <View style={styles.modernImageOverlay}>
                  <View style={styles.imageCountBadge}>
                    <Ionicons name="camera" size={12} color="#FFFFFF" />
                    <Text style={styles.imageCountText}>{item.images.length}</Text>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.placeholderImageModern}>
                <FontAwesome5 name="pills" size={32} color="#E0E0E0" />
                <Text style={styles.placeholderText}>No Image</Text>
              </View>
            )}
          </View>

          {/* Card Content */}
          <View style={styles.modernCardContent}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.medicineNameModern} numberOfLines={2}>
                {item.name}
              </Text>
              <View style={[
                styles.categoryBadge,
                { backgroundColor: item.category === 'medicine' ? '#4A90E2' : '#10B981' }
              ]}>
                <Text style={styles.categoryBadgeText}>
                  {item.category === 'medicine' ? '💊' : '🌿'}
                </Text>
              </View>
            </View>
            
            <Text style={styles.medicineDetailsModern} numberOfLines={2}>
              {item.details}
            </Text>

            {/* Card Footer */}
            <View style={styles.modernCardFooter}>
              <View style={styles.dateContainer}>
                <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                <Text style={styles.addedDateModern}>
                  {new Date(item.createdAt).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: new Date(item.createdAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                  })}
                </Text>
              </View>
              <View style={styles.viewButton}>
                <Text style={styles.viewButtonText}>View</Text>
                <Ionicons name="arrow-forward" size={14} color="#4F46E5" />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderStatsCard = () => {
    const stats = getMedicineStats();
    
    return (
      <View style={styles.statsContainer}>
        <View style={styles.statsCard}>
          <FontAwesome5 name="pills" size={24} color="#4F46E5" />
          <Text style={styles.statsNumber}>{stats.medicinesCount}</Text>
          <Text style={styles.statsLabel}>Medicines</Text>
        </View>
        <View style={styles.statsCard}>
          <FontAwesome5 name="leaf" size={24} color="#10B981" />
          <Text style={styles.statsNumber}>{stats.desiTotkaCount}</Text>
          <Text style={styles.statsLabel}>Desi Totka</Text>
        </View>
        <View style={styles.statsCard}>
          <Ionicons name="time" size={24} color="#DC2626" />
          <Text style={styles.statsNumber}>{stats.recent}</Text>
          <Text style={styles.statsLabel}>This Week</Text>
        </View>
      </View>
    );
  };

  const renderTypeFilter = () => {
    const types = [
      { key: 'All', label: 'All', icon: '📋' },
      { key: 'medicine', label: 'Medicines', icon: '💊' },
      { key: 'desi_totka', label: 'Desi Totka', icon: '🌿' }
    ];
    
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
        {types.map((type) => (
          <TouchableOpacity
            key={type.key}
            style={[
              styles.categoryChip,
              selectedType === type.key && styles.categoryChipActive
            ]}
            onPress={() => setSelectedType(type.key)}
          >
            <Text style={[
              styles.categoryText,
              selectedType === type.key && styles.categoryTextActive
            ]}>
              {type.icon} {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderCategoryFilter = () => {
    const categories = getAnimalCategories();
    
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === category && styles.categoryTextActive
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyImageContainer}>
        <FontAwesome5 name="stethoscope" size={80} color="#E5E7EB" />
        <View style={styles.emptyPlusIcon}>
          <Ionicons name="add-circle" size={32} color="#4F46E5" />
        </View>
      </View>
      <Text style={styles.emptyTitle}>No Medicines Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start building your medicine database by adding{'\n'}your first entry
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('AddMedicine')}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.emptyButtonText}>Add First Medicine</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.emptyButton, { backgroundColor: '#4A90E2', marginTop: 12 }]}
        onPress={() => {
          console.log('🔒 Backup button pressed from empty state');
          navigation.navigate('Backup');
        }}
      >
        <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
        <Text style={styles.emptyButtonText}>🔒 Data Backup</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Animated.View style={styles.loadingIcon}>
            <FontAwesome5 name="heartbeat" size={40} color="#4F46E5" />
          </Animated.View>
          <Text style={styles.loadingText}>Loading Your Medicines...</Text>
          <Text style={styles.loadingSubtext}>Please wait</Text>
        </View>
      </View>
    );
  }

  const filteredMedicines = getFilteredMedicines();

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
      <View style={styles.container}>
        {medicines.length === 0 ? (
          <ScrollView 
            style={styles.emptyScrollView}
            contentContainerStyle={styles.emptyScrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {renderEmptyState()}
          </ScrollView>
        ) : (
          <Animated.ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {/* Header with gradient background */}
            <View style={styles.headerGradient}>
              <View style={styles.headerContent}>
                <View style={styles.headerTop}>
                  <View>
                    <Text style={styles.headerWelcome}>Good Day! 👋</Text>
                    <Text style={styles.headerTitle}>Animal Care Hub</Text>
                  </View>
                  <View style={styles.headerButtons}>
                    <TouchableOpacity 
                      style={styles.headerButton}
                      onPress={() => {
                        console.log('🔒 Backup button pressed - navigating to Backup screen');
                        navigation.navigate('Backup');
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="cloud-upload" size={24} color="#4A90E2" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.favoritesButton}
                      onPress={() => navigation.navigate('Favorites')}
                      activeOpacity={0.8}
                    >
                      <MaterialIcons name="favorite" size={24} color="#FF6B9D" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                {renderStatsCard()}
              </View>
            </View>

            {/* Type Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Filter by Type</Text>
              {renderTypeFilter()}
            </View>

            {/* Category Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Filter by Animal</Text>
              {renderCategoryFilter()}
            </View>

            {/* Medicine Grid */}
            <View style={styles.medicineGrid}>
              <View style={styles.gridHeader}>
                <Text style={styles.gridTitle}>
                  {selectedType === 'All' 
                    ? (selectedCategory === 'All' 
                        ? `All Entries (${filteredMedicines.length})`
                        : `${selectedCategory} Entries (${filteredMedicines.length})`
                      )
                    : (selectedCategory === 'All'
                        ? `${selectedType === 'medicine' ? 'Medicines' : 'Desi Totka'} (${filteredMedicines.length})`
                        : `${selectedCategory} ${selectedType === 'medicine' ? 'Medicines' : 'Desi Totka'} (${filteredMedicines.length})`
                      )
                  }
                </Text>
                <TouchableOpacity style={styles.sortButton}>
                  <Ionicons name="filter" size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>

                             <View style={styles.cardsContainer}>
                 {filteredMedicines.map((item, index) => (
                   <View key={item.id} style={{ width: '100%' }}>
                     {renderMedicineCard({ item, index })}
                   </View>
                 ))}
               </View>
            </View>
            
            <View style={styles.bottomSpacing} />
          </Animated.ScrollView>
        )}

        {/* Modern Floating Action Button - Only show when medicines exist */}
        {medicines.length > 0 && (
          <View style={styles.fabContainer}>
            <TouchableOpacity
              style={styles.modernFab}
              onPress={() => navigation.navigate('AddMedicine')}
              activeOpacity={0.9}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>
      <AlertComponent />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  
  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingIcon: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Header Section
  headerGradient: {
    backgroundColor: '#4F46E5',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  headerWelcome: {
    fontSize: 16,
    color: '#C7D2FE',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.3)',
    marginRight: 8,
  },
  favoritesButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 157, 0.3)',
  },

  // Stats Section
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statsCard: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  statsLabel: {
    fontSize: 12,
    color: '#C7D2FE',
    marginTop: 4,
    textAlign: 'center',
  },

  // Filter Section
  filterSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 15,
  },
  categoryContainer: {
    flexDirection: 'row',
  },
  categoryContent: {
    paddingRight: 20,
  },
  categoryChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  categoryText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },

  // Medicine Grid
  medicineGrid: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  gridTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  sortButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  cardsContainer: {
    flexDirection: 'column',
  },

  // Modern Cards
  cardWrapper: {
    marginBottom: 20,
  },
  modernCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  cardLeft: {
    marginRight: width * 0.02,
  },
  cardRight: {
    marginLeft: width * 0.02,
  },

  // Card Header
  cardHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  cardHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  animalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  animalEmoji: {
    fontSize: 24,
  },
  cardHeaderText: {
    flex: 1,
  },
  animalTypeModern: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  medicineCount: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  cardActions: {
    padding: 8,
  },

  // Card Image
  cardImageContainer: {
    height: 180,
    position: 'relative',
  },
  modernCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImageModern: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  modernImageOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  imageCountBadge: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },

  // Card Content
  modernCardContent: {
    padding: 20,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  medicineNameModern: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: 24,
    flex: 1,
    marginRight: 8,
  },
  categoryBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  medicineDetailsModern: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },

  // Card Footer
  modernCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addedDateModern: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 6,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  viewButtonText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '600',
    marginRight: 4,
  },

  // Empty State
  emptyScrollView: {
    flex: 1,
  },
  emptyScrollContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyImageContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  emptyPlusIcon: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    shadowColor: '#4F46E5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Floating Action Button
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
  },
  modernFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },

  // Scroll Views
  scrollView: {
    flex: 1,
  },
  bottomSpacing: {
    height: 100,
  },
});

export default ViewMedicinesScreen; 