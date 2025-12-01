// ItemDetailScreen – follow the spec (IMPORTANT: DO NOT show founderAnswers)
import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/models';
import { PrimaryButton } from '../../components/PrimaryButton';

type ItemDetailNavigationProp = StackNavigationProp<RootStackParamList, 'ItemDetail'>;
type ItemDetailRouteProp = RouteProp<RootStackParamList, 'ItemDetail'>;

const ItemDetailScreen = () => {
  const navigation = useNavigation<ItemDetailNavigationProp>();
  const route = useRoute<ItemDetailRouteProp>();
  const { foundItem } = route.params;

  const handleAnswerQuestions = () => {
    navigation.navigate('AnswerQuestionsVideo', { foundItem });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Image source={{ uri: foundItem.imageUrl }} style={styles.image} />

        <View style={styles.card}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{foundItem.status}</Text>
          </View>

          <Text style={styles.category}>{foundItem.category}</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{foundItem.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Found Location</Text>
            <Text style={styles.locationText}>{foundItem.location}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Date Found</Text>
            <Text style={styles.dateText}>
              {new Date(foundItem.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>❓ Ownership Questions</Text>
            <Text style={styles.questionsInfo}>
              To verify ownership, you'll need to answer the following questions:
            </Text>
            {foundItem.questions.map((question, index) => (
              <View key={index} style={styles.questionItem}>
                <Text style={styles.questionNumber}>{index + 1}.</Text>
                <Text style={styles.questionText}>{question}</Text>
              </View>
            ))}
            <Text style={styles.questionsNote}>
              ⚠️ Note: You must answer these questions via video to verify ownership
            </Text>
          </View>
        </View>

        <View style={styles.actionSection}>
          <PrimaryButton
            title="Answer Ownership Questions"
            onPress={handleAnswerQuestions}
            style={styles.button}
          />
          <Text style={styles.actionNote}>
            After verification, you'll be able to contact the founder
          </Text>
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
    paddingBottom: 30,
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: '#E0E0E0',
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: -40,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  category: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 20,
    textTransform: 'capitalize',
  },
  section: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 22,
  },
  locationText: {
    fontSize: 15,
    color: '#4A90E2',
    fontWeight: '500',
  },
  dateText: {
    fontSize: 15,
    color: '#666666',
  },
  questionsInfo: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    lineHeight: 20,
  },
  questionItem: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingLeft: 8,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90E2',
    marginRight: 8,
    minWidth: 20,
  },
  questionText: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  questionsNote: {
    fontSize: 12,
    color: '#FF9800',
    marginTop: 12,
    fontStyle: 'italic',
  },
  actionSection: {
    paddingHorizontal: 20,
  },
  button: {
    marginBottom: 12,
  },
  actionNote: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default ItemDetailScreen;
