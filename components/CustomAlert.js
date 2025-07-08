import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const CustomAlert = ({
  visible,
  type = 'info', // 'success', 'error', 'warning', 'info', 'confirm'
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false,
}) => {
  const scaleValue = new Animated.Value(0);

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 7,
      }).start();
    } else {
      scaleValue.setValue(0);
    }
  }, [visible]);

  const getAlertConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle',
          iconColor: '#10B981',
          headerColor: '#ECFDF5',
          borderColor: '#10B981',
        };
      case 'error':
        return {
          icon: 'close-circle',
          iconColor: '#EF4444',
          headerColor: '#FEF2F2',
          borderColor: '#EF4444',
        };
      case 'warning':
        return {
          icon: 'warning',
          iconColor: '#F59E0B',
          headerColor: '#FFFBEB',
          borderColor: '#F59E0B',
        };
      case 'confirm':
        return {
          icon: 'help-circle',
          iconColor: '#6366F1',
          headerColor: '#EEF2FF',
          borderColor: '#6366F1',
        };
      default:
        return {
          icon: 'information-circle',
          iconColor: '#3B82F6',
          headerColor: '#EFF6FF',
          borderColor: '#3B82F6',
        };
    }
  };

  const config = getAlertConfig();

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel || onConfirm}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.alertContainer,
            {
              transform: [{ scale: scaleValue }],
              borderTopColor: config.borderColor,
            },
          ]}
        >
          {/* Header with Icon */}
          <View style={[styles.alertHeader, { backgroundColor: config.headerColor }]}>
            <View style={[styles.iconContainer, { backgroundColor: config.iconColor }]}>
              <Ionicons name={config.icon} size={28} color="#FFFFFF" />
            </View>
          </View>

          {/* Content */}
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>{title}</Text>
            <Text style={styles.alertMessage}>{message}</Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {showCancel && (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                { backgroundColor: config.iconColor },
                showCancel && styles.buttonMargin,
              ]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Custom Alert Hook for easier usage
export const useCustomAlert = () => {
  const [alertConfig, setAlertConfig] = React.useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: false,
  });

  const showAlert = (config) => {
    setAlertConfig({
      visible: true,
      type: 'info',
      confirmText: 'OK',
      cancelText: 'Cancel',
      showCancel: false,
      ...config,
      onConfirm: () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
        config.onConfirm && config.onConfirm();
      },
      onCancel: () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
        config.onCancel && config.onCancel();
      },
    });
  };

  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  return {
    alertConfig,
    showAlert,
    hideAlert,
    AlertComponent: () => <CustomAlert {...alertConfig} />,
  };
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  alertContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 340,
    borderTopWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  alertHeader: {
    paddingVertical: 25,
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContent: {
    paddingHorizontal: 25,
    paddingBottom: 25,
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 25,
    paddingBottom: 25,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    marginRight: 10,
  },
  confirmButton: {
    backgroundColor: '#3B82F6',
  },
  buttonMargin: {
    marginLeft: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default CustomAlert; 