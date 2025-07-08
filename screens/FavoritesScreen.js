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
  ScrollView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { getFavoriteMedicines, toggleFavorite } from '../utils/storage';
import { useCustomAlert } from '../components/CustomAlert';

const { width } = Dimensions.get('window');

const FavoritesScreen = ({ navigation }) => {
  const [favorites, setFavorites] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollY = new Animated.Value(0);
  const { showAlert, AlertComponent } = useCustomAlert();

  const loadFavorites = async () => {
    try {
      const favoriteData = await getFavoriteMedicines();
      setFavorites(favoriteData);
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Loading Error',
        message: 'We couldn\'t load your favorite medicines. Please try again.',
        confirmText: 'Retry',
        onConfirm: () => loadFavorites(),
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };

  const handleToggleFavorite = async (medicineId) => {
    try {
      const updatedMedicine = await toggleFavorite(medicineId);
      const updatedFavorites = favorites.filter(med => med.id !== medicineId);
      setFavorites(updatedFavorites);
      
      showAlert({
        type: 'success',
        title: '💔 Removed from Favorites',
        message: `${updatedMedicine.name} has been removed from your favorites.`,
        confirmText: 'OK',
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

  const navigateToDetail = (medicine) => {
    navigation.navigate('MedicineDetail', { medicine });
  };

  const renderFavoriteCard = ({ item, index }) => {
    const animalData = getAnimalIcon(item.animal);
    
    return (
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            transform: [{
              translateY: scrollY.interpolate({
                inputRange: [-1, 0, index * 200, (index + 1) * 200],
                outputRange: [0, 0, 0, -30],
                extrapolateLeft: 'clamp',
              })
            }]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.favoriteCard}
          onPress={() => navigateToDetail(item)}
          activeOpacity={0.95}
        >
          {/* Card Header */}
          <View style={[styles.cardHeader, { backgroundColor: animalData.color + '15' }]}>
            <View style={styles.cardHeaderContent}>
              <View style={[styles.animalIconContainer, { backgroundColor: animalData.color }]}>
                <Text style={styles.animalEmoji}>{animalData.emoji}</Text>
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.animalType}>{item.animal}</Text>
                <Text style={styles.medicineCount}>
                  {item.images?.length || 0} photos
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.heartButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleToggleFavorite(item.id);
                }}
                activeOpacity={0.7}
              >
                <MaterialIcons 
                  name="favorite" 
                  size={24} 
                  color="#FF6B9D" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Medicine Image */}
          <View style={styles.imageSection}>
            {item.images && item.images.length > 0 ? (
              <Image source={{ uri: item.images[0] }} style={styles.medicineImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <FontAwesome5 name="pills" size={40} color="#E0E0E0" />
              </View>
            )}
          </View>

          {/* Medicine Info */}
          <View style={styles.medicineInfo}>
            <Text style={styles.medicineName} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.medicineDetails} numberOfLines={2}>
              {item.details}
            </Text>
            <View style={styles.cardFooter}>
              <View style={styles.dateContainer}>
                <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                <Text style={styles.addedDate}>
                  {new Date(item.createdAt).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: new Date(item.createdAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                  })}
                </Text>
              </View>
              <Ionicons name="heart" size={16} color="#FF6B9D" />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerContent}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>💖 My Favorites</Text>
          <Text style={styles.headerSubtitle}>
            {favorites.length} favorite {favorites.length === 1 ? 'medicine' : 'medicines'}
          </Text>
        </View>
        <View style={styles.headerIcon}>
          <FontAwesome5 name="heart" size={28} color="#FF6B9D" />
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <MaterialIcons name="favorite-border" size={80} color="#E5E7EB" />
        <View style={styles.emptyHeartOverlay}>
          <Ionicons name="heart-dislike" size={30} color="#D1D5DB" />
        </View>
      </View>
      <Text style={styles.emptyTitle}>No Favorites Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start adding medicines to your favorites by tapping the heart icon on any medicine card
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => navigation.navigate('ViewMedicines')}
        activeOpacity={0.8}
      >
        <Ionicons name="search-outline" size={20} color="#FFFFFF" />
        <Text style={styles.browseButtonText}>Browse Medicines</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B9D" />
        <Text style={styles.loadingText}>Loading favorites...</Text>
      </View>
    );
  }

  return (
    <>
      {renderHeader()}
      <View style={styles.container}>
        {favorites.length > 0 ? (
          <Animated.FlatList
            data={favorites}
            renderItem={renderFavoriteCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true }
            )}
          />
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {renderEmptyState()}
          </ScrollView>
        )}
      </View>
      <AlertComponent />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  headerIcon: {
    padding: 15,
    backgroundColor: '#FFF0F3',
    borderRadius: 20,
  },
  listContainer: {
    padding: 20,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  cardWrapper: {
    marginBottom: 20,
  },
  favoriteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 15,
  },
  cardHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  animalIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  animalEmoji: {
    fontSize: 20,
  },
  cardHeaderText: {
    flex: 1,
  },
  animalType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  medicineCount: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  heartButton: {
    padding: 8,
  },
  imageSection: {
    height: 150,
  },
  medicineImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  medicineInfo: {
    padding: 15,
  },
  medicineName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  medicineDetails: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addedDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIconContainer: {
    position: 'relative',
    marginBottom: 30,
  },
  emptyHeartOverlay: {
    position: 'absolute',
    top: 25,
    right: 15,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B9D',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
});

export default FavoritesScreen; 