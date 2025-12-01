// ReportFoundStartScreen – follow the spec
import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../../types/models';
import { PrimaryButton } from '../../components/PrimaryButton';

type ReportFoundStartNavigationProp = StackNavigationProp<RootStackParamList, 'ReportFoundStart'>;

const ReportFoundStartScreen = () => {
  const navigation = useNavigation<ReportFoundStartNavigationProp>();
  const [imageUri, setImageUri] = useState<string | null>(null);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library');
      return false;
    }
    return true;
  };

  const handleSelectImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleCaptureImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your camera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleNext = () => {
    if (!imageUri) {
      Alert.alert('Image Required', 'Please select or capture an image first');
      return;
    }

    navigation.navigate('ReportFoundDetails', { imageUri });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Report a Found Item</Text>
          <Text style={styles.subtitle}>
            Help someone find their lost item by reporting what you found
          </Text>
        </View>

        <View style={styles.imageSection}>
          {imageUri ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.image} />
              <Text style={styles.imageLabel}>✓ Image selected</Text>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderIcon}>📷</Text>
              <Text style={styles.placeholderText}>No image selected</Text>
            </View>
          )}
        </View>

        <View style={styles.buttonGroup}>
          <PrimaryButton
            title="📷 Capture Photo"
            onPress={handleCaptureImage}
            style={styles.button}
          />
          <PrimaryButton
            title="🖼️ Select from Gallery"
            onPress={handleSelectImage}
            style={styles.button}
          />
        </View>

        <PrimaryButton
          title="Next"
          onPress={handleNext}
          disabled={!imageUri}
          style={styles.nextButton}
        />

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>💡 Tips</Text>
          <Text style={styles.infoText}>• Take a clear photo of the item</Text>
          <Text style={styles.infoText}>• Include identifying features</Text>
          <Text style={styles.infoText}>• Good lighting helps</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  imageSection: {
    marginBottom: 24,
  },
  imageContainer: {
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
  },
  imageLabel: {
    marginTop: 12,
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  imagePlaceholder: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#CCCCCC',
    borderStyle: 'dashed',
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999999',
  },
  buttonGroup: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 12,
  },
  nextButton: {
    marginBottom: 24,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
});

export default ReportFoundStartScreen;
