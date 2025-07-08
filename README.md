# 🐄 Animal Medicine Tracker

A React Native Expo mobile application for dairy farms to track medicines prescribed by doctors for different animals like goats, heifers, and cows. The app works offline and uses AsyncStorage for local data persistence.

## 📱 Features

### ✅ Add Medicine
- **Medicine Name**: Single-line text input for medicine name
- **Animal Type**: Dropdown picker with predefined options (Cow, Goat, Heifer, Buffalo, Sheep)
- **Medicine Details**: Multiline text input for dosage, purpose, side effects, etc.
- **Medicine Images**: Upload 2-3 images from phone gallery
- **Form Validation**: All fields required with inline error messages
- **Local Storage**: Data saved to AsyncStorage for offline access

### ✅ View Medicines
- **Horizontal Cards**: Scrollable cards displaying medicine entries
- **Card Information**: Thumbnail image, medicine name, animal type
- **Visual Indicators**: Image count, animal icons, date added
- **Pull to Refresh**: Refresh medicine list
- **Empty State**: Helpful message when no medicines exist

### ✅ Medicine Details
- **Full Information**: Complete medicine details display
- **Image Gallery**: View all uploaded images with zoom functionality
- **Swipeable Images**: Navigate between multiple images
- **Additional Info**: Creation date, time, and unique ID
- **Delete Option**: Remove medicine entries with confirmation

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your mobile device

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Medicine_Store/MedicineTracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   # or
   expo start
   ```

4. **Run on device**
   - Scan the QR code with Expo Go app (Android) or Camera app (iOS)
   - Or press `a` for Android emulator, `i` for iOS simulator

## 📦 Dependencies

### Core Dependencies
- **React Native**: 0.79.5
- **Expo**: ~53.0.17
- **React**: 19.0.0

### Navigation
- **@react-navigation/native**: ^7.0.9
- **@react-navigation/stack**: ^7.0.5
- **react-native-screens**: ~4.1.0
- **react-native-safe-area-context**: 4.14.0
- **react-native-gesture-handler**: ~2.22.1

### Storage & Media
- **@react-native-async-storage/async-storage**: 1.27.0
- **expo-image-picker**: ~16.0.2

### UI Components
- **@react-native-picker/picker**: 2.9.0
- **expo-vector-icons**: ^14.0.4

## 📁 Project Structure

```
MedicineTracker/
├── components/          # Reusable UI components
│   └── LoadingSpinner.js
├── navigation/          # Navigation configuration
│   └── AppNavigator.js
├── screens/            # Main application screens
│   ├── AddMedicineScreen.js
│   ├── ViewMedicinesScreen.js
│   └── MedicineDetailScreen.js
├── utils/              # Utility functions
│   └── storage.js
├── App.js              # Main application entry point
├── app.json            # Expo configuration
└── package.json        # Dependencies and scripts
```

## 💾 Data Storage

The app uses AsyncStorage for local data persistence with the following structure:

```javascript
{
  id: "unique_identifier",
  name: "Medicine Name",
  animal: "Cow",
  details: "Dosage and usage instructions",
  images: ["uri1", "uri2", "uri3"],
  createdAt: "2024-01-01T00:00:00.000Z"
}
```

## 🎨 UI/UX Features

- **Modern Design**: Clean, neutral colors with subtle contrast
- **Responsive Images**: Resizable thumbnails with full-screen view
- **Form Validation**: Inline error messages for better UX
- **Visual Icons**: Animal and medical icons for better visual cues
- **Smooth Animations**: Fade and slide transitions between screens
- **Horizontal Scrolling**: Instagram-style card browsing
- **Pull-to-Refresh**: Standard mobile refresh pattern

## 📱 Supported Platforms

- **iOS**: iPhone and iPad (iOS 11+)
- **Android**: Android 5.0+ (API level 21+)

## 🔧 Development

### Available Scripts

- `npm start`: Start Expo development server
- `npm run android`: Run on Android device/emulator
- `npm run ios`: Run on iOS device/simulator
- `npm run web`: Run in web browser

### Building for Production

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

## 📋 TODO / Future Enhancements

- [ ] Search and filter medicines
- [ ] Export medicine data to PDF/CSV
- [ ] Medicine expiry date tracking
- [ ] Dosage schedule reminders
- [ ] Cloud backup integration
- [ ] Multi-farm support
- [ ] Veterinarian contact integration

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler issues**
   ```bash
   npx expo start --clear
   ```

2. **AsyncStorage not working**
   - Ensure proper permissions in app.json
   - Check device storage availability

3. **Image picker not working**
   - Verify camera/photo library permissions
   - Test on physical device (camera not available in simulator)

## 📄 License

This project is licensed under the MIT License.

## 👥 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions, please open an issue in the repository or contact the development team.

---

Built with ❤️ for dairy farmers and veterinarians 