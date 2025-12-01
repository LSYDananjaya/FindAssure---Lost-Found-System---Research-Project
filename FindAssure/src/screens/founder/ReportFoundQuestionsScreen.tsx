// ReportFoundQuestionsScreen – follow the spec
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/models';
import { PrimaryButton } from '../../components/PrimaryButton';
import { QuestionChip } from '../../components/QuestionChip';

type ReportFoundQuestionsNavigationProp = StackNavigationProp<RootStackParamList, 'ReportFoundQuestions'>;
type ReportFoundQuestionsRouteProp = RouteProp<RootStackParamList, 'ReportFoundQuestions'>;

// Generate dummy questions based on category
const generateQuestions = (category: string, description: string): string[] => {
  const baseQuestions = [
    "What color is the item?",
    "Where exactly did you find it?",
    "What date did you find it?",
    "What time of day did you find it?",
    "Are there any identifying marks or features?",
    "What is the brand or manufacturer?",
    "What is the approximate size or dimensions?",
    "What is the condition of the item?",
    "Was there anything inside or attached to it?",
    "What material is it made of?",
  ];

  // You can add category-specific questions later
  return baseQuestions;
};

const ReportFoundQuestionsScreen = () => {
  const navigation = useNavigation<ReportFoundQuestionsNavigationProp>();
  const route = useRoute<ReportFoundQuestionsRouteProp>();
  const { imageUri, category, description } = route.params;

  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  useEffect(() => {
    const questions = generateQuestions(category, description);
    setSuggestedQuestions(questions);
  }, [category, description]);

  const handleToggleQuestion = (question: string) => {
    if (selectedQuestions.includes(question)) {
      setSelectedQuestions(selectedQuestions.filter(q => q !== question));
    } else {
      if (selectedQuestions.length >= 5) {
        Alert.alert('Limit Reached', 'You can only select exactly 5 questions');
        return;
      }
      setSelectedQuestions([...selectedQuestions, question]);
    }
  };

  const handleNext = () => {
    if (selectedQuestions.length !== 5) {
      Alert.alert(
        'Selection Required',
        `You must select exactly 5 questions. Currently selected: ${selectedQuestions.length}`
      );
      return;
    }

    navigation.navigate('ReportFoundAnswers', {
      imageUri,
      category,
      description,
      selectedQuestions,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Ownership Questions</Text>
            <Text style={styles.subtitle}>
              Choose exactly 5 questions that the owner should answer to verify ownership
            </Text>
            <View style={styles.counter}>
              <Text style={styles.counterText}>
                Selected: {selectedQuestions.length} / 5
              </Text>
            </View>
          </View>

          <View style={styles.questionsContainer}>
            {suggestedQuestions.map((question, index) => (
              <QuestionChip
                key={index}
                question={question}
                selected={selectedQuestions.includes(question)}
                onPress={() => handleToggleQuestion(question)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title="Next"
          onPress={handleNext}
          disabled={selectedQuestions.length !== 5}
        />
      </View>
    </View>
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
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 16,
  },
  counter: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  counterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1565C0',
  },
  questionsContainer: {
    marginBottom: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});

export default ReportFoundQuestionsScreen;
