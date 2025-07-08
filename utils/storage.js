import AsyncStorage from '@react-native-async-storage/async-storage';

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
    
    // Add new medicine with unique ID
    const newMedicine = {
      id: generateId(),
      ...medicine,
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
    const updatedMedicines = medicines.map(medicine => 
      medicine.id === id 
        ? { ...medicine, ...updatedMedicine, updatedAt: new Date().toISOString() }
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