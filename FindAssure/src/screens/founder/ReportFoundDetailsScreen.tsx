// ReportFoundDetailsScreen – follow the spec
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  Image, 
  ScrollView, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/models';
import { PrimaryButton } from '../../components/PrimaryButton';
import { CategoryPicker } from '../../components/CategoryPicker';
import { ITEM_CATEGORIES } from '../../constants/appConstants';

type ReportFoundDetailsNavigationProp = StackNavigationProp<RootStackParamList, 'ReportFoundDetails'>;
type ReportFoundDetailsRouteProp = RouteProp<RootStackParamList, 'ReportFoundDetails'>;

const ReportFoundDetailsScreen = () => {
  const navigation = useNavigation<ReportFoundDetailsNavigationProp>();
  const route = useRoute<ReportFoundDetailsRouteProp>();
  const { imageUri } = route.params;

  const [category, setCategory] = useState(ITEM_CATEGORIES[0]);
  const [description, setDescription] = useState('');

  const handleConfirm = () => {
    if (!category || !description.trim()) {
      Alert.alert('Required Fields', 'Please fill in all fields');
      return;
    }

    navigation.navigate('ReportFoundQuestions', {
      imageUri,
      category: category,
      description: description.trim(),
    });
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Image source={{ uri: imageUri }} style={styles.image} />

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
                placeholder="Provide detailed description of the item..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              <Text style={styles.helperText}>
                Include color, brand, distinguishing features, etc.
              </Text>
            </View>

            <PrimaryButton
              title="Next"
              onPress={handleConfirm}
              style={styles.confirmButton}
            />
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
  image: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    marginBottom: 20,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
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
  confirmButton: {
    marginTop: 10,
  },
});

export default ReportFoundDetailsScreen;
