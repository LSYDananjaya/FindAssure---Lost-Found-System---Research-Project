// AnswerQuestionsVideoScreen – follow the spec (stub video recording for now)
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput,
  StyleSheet, 
  ScrollView, 
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, VideoAnswer } from '../../types/models';
import { PrimaryButton } from '../../components/PrimaryButton';
import { itemsApi } from '../../api/itemsApi';

type AnswerQuestionsVideoNavigationProp = StackNavigationProp<RootStackParamList, 'AnswerQuestionsVideo'>;
type AnswerQuestionsVideoRouteProp = RouteProp<RootStackParamList, 'AnswerQuestionsVideo'>;

const AnswerQuestionsVideoScreen = () => {
  const navigation = useNavigation<AnswerQuestionsVideoNavigationProp>();
  const route = useRoute<AnswerQuestionsVideoRouteProp>();
  const { foundItem } = route.params;

  // Store text answers for each question (video will be implemented later)
  const [textAnswers, setTextAnswers] = useState<string[]>(
    new Array(foundItem.questions.length).fill('')
  );
  const [loading, setLoading] = useState(false);

  const handleAnswerChange = (index: number, text: string) => {
    const newAnswers = [...textAnswers];
    newAnswers[index] = text;
    setTextAnswers(newAnswers);
  };

  const handleRecordVideo = () => {
    // TODO: Implement actual video recording with Expo Camera/AV in future
    Alert.alert(
      'Coming Soon',
      'Video recording will be implemented in a future update. Please use text answers for now.'
    );
  };

  const handleSubmit = async () => {
    const allAnswered = textAnswers.every(answer => answer.trim().length > 0);

    if (!allAnswered) {
      Alert.alert('Incomplete', 'Please answer all questions');
      return;
    }

    try {
      setLoading(true);

      // Build video answers array (using text for now, video URL will be added later)
      const ownerVideoAnswers: VideoAnswer[] = foundItem.questions.map((question, index) => ({
        question,
        videoUrl: textAnswers[index].trim(), // For now, storing text as videoUrl
      }));

      // Submit verification request
      await itemsApi.submitVerification({
        foundItemId: foundItem._id,
        ownerVideoAnswers,
      });

      navigation.navigate('VerificationPending');
    } catch (error: any) {
      Alert.alert(
        'Submission Failed',
        error.message || 'Could not submit verification. Please try again.'
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
            <Text style={styles.title}>Answer the Questions</Text>
            <Text style={styles.subtitle}>
              Answer each question to verify your ownership
            </Text>
          </View>

          <View style={styles.questionsContainer}>
            {foundItem.questions.map((question, index) => (
              <View key={index} style={styles.questionCard}>
                <Text style={styles.questionNumber}>Question {index + 1}</Text>
                <Text style={styles.questionText}>{question}</Text>

                {/* Video Option - Placeholder for future implementation */}
                <TouchableOpacity 
                  style={styles.recordButton}
                  onPress={handleRecordVideo}
                >
                  <Text style={styles.recordIcon}>🎥</Text>
                  <Text style={styles.recordText}>Record Video Answer (Coming Soon)</Text>
                </TouchableOpacity>

                <Text style={styles.orText}>OR</Text>

                {/* Text Input Option */}
                <TextInput
                  style={styles.answerInput}
                  placeholder="Type your answer here..."
                  value={textAnswers[index]}
                  onChangeText={(text) => handleAnswerChange(index, text)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            ))}
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              📝 Answer Tips:
            </Text>
            <Text style={styles.infoText}>• Be specific and accurate</Text>
            <Text style={styles.infoText}>• Provide details only the true owner would know</Text>
            <Text style={styles.infoText}>• Answer all questions honestly</Text>
            <Text style={styles.infoText}>• Video recording will be available in a future update</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title="Submit Verification"
          onPress={handleSubmit}
          loading={loading}
        />
      </View>
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
  },
  questionsContainer: {
    marginBottom: 20,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  questionNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 6,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  recordButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderStyle: 'dashed',
    marginBottom: 8,
  },
  recordIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  recordText: {
    fontSize: 13,
    color: '#999999',
    fontWeight: '500',
  },
  orText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999999',
    marginVertical: 8,
    fontWeight: '600',
  },
  answerInput: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#FAFAFA',
    minHeight: 80,
  },
  infoBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  infoText: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 4,
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

export default AnswerQuestionsVideoScreen;
