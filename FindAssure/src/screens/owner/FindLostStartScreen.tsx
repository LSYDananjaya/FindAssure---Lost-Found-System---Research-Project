// FindLostStartScreen – follow the spec
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  ScrollView, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../context/AuthContext';
import { RootStackParamList } from '../../types/models';
import { PrimaryButton } from '../../components/PrimaryButton';
import { CategoryPicker } from '../../components/CategoryPicker';
import { LocationPicker } from '../../components/LocationPicker';
import { itemsApi } from '../../api/itemsApi';
import { LOCATIONS, ITEM_CATEGORIES, CONFIDENCE_LEVEL_MIN, CONFIDENCE_LEVEL_MAX, CONFIDENCE_LEVEL_DEFAULT } from '../../constants/appConstants';

type FindLostStartNavigationProp = StackNavigationProp<RootStackParamList, 'FindLostStart'>;

const FindLostStartScreen = () => {
  const navigation = useNavigation<FindLostStartNavigationProp>();
  const { user } = useAuth();

  const [category, setCategory] = useState(ITEM_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [confidenceLevel, setConfidenceLevel] = useState(CONFIDENCE_LEVEL_DEFAULT);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to search for lost items', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }

    if (!category || !description.trim() || !location) {
      Alert.alert('Required Fields', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);

      // Step A: Save the lost request with location and confidence level
      await itemsApi.reportLostItem({
        category: category,
        description: description.trim(),
        location: location,
        confidenceLevel: confidenceLevel,
      });

      // Step B: Get all found items
      const foundItems = await itemsApi.getFoundItems();

      navigation.navigate('FindLostResults', { foundItems });
    } catch (error: any) {
      Alert.alert(
        'Search Failed',
        error.message || 'Could not search for items. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Find Your Lost Item</Text>
            <Text style={styles.subtitle}>
              Search through reported found items to see if someone found your lost item
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category *</Text>
              <CategoryPicker
                selectedValue={category}
                onValueChange={setCategory}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your lost item in detail..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              <Text style={styles.helperText}>
                Include color, brand, where you lost it, when you lost it, etc.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Lost Location *</Text>
              <LocationPicker
                selectedValue={location}
                onValueChange={setLocation}
              />
              <Text style={styles.helperText}>
                Select the location where you think you lost the item
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Confidence Level: {confidenceLevel}%
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={CONFIDENCE_LEVEL_MIN}
                maximumValue={CONFIDENCE_LEVEL_MAX}
                step={1}
                value={confidenceLevel}
                onValueChange={setConfidenceLevel}
                minimumTrackTintColor="#007AFF"
                maximumTrackTintColor="#DDDDDD"
                thumbTintColor="#007AFF"
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabelText}>Not Sure (1%)</Text>
                <Text style={styles.sliderLabelText}>Very Sure (100%)</Text>
              </View>
              <Text style={styles.helperText}>
                How confident are you about this location?
              </Text>
            </View>

            <PrimaryButton
              title="Search Found Items"
              onPress={handleSearch}
              loading={loading}
              style={styles.searchButton}
            />
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>🔒 Privacy & Security</Text>
            <Text style={styles.infoText}>
              • You'll need to answer verification questions to prove ownership
            </Text>
            <Text style={styles.infoText}>
              • Founder contact info is only shown after successful verification
            </Text>
            <Text style={styles.infoText}>
              • Your search is saved and you'll be notified of matches
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
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
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#999999',
    marginTop: 6,
  },
  slider: {
    width: '100%',
    height: 40,
    marginVertical: 8,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderLabelText: {
    fontSize: 11,
    color: '#666666',
  },
  searchButton: {
    marginTop: 10,
  },
  infoBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 4,
  },
});

export default FindLostStartScreen;
