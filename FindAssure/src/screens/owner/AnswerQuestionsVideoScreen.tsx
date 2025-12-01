// AnswerQuestionsVideoScreen – follow the spec (stub video recording for now)
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Alert,
  TouchableOpacity
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

  // Store video URIs for each question (stubbed for now)
  const [videoAnswers, setVideoAnswers] = useState<{ [key: number]: string }>({}); 
  const [loading, setLoading] = useState(false);

  const handleRecordVideo = (questionIndex: number) => {
    // TODO: Implement actual video recording with Expo Camera/AV
    // For now, use a stub/placeholder
    Alert.alert(
      'Record Video',
      'Video recording will be implemented here using Expo Camera',
      [
        {
          text: 'Simulate Recording',
          onPress: () => {
            // Simulate a video recording
            const stubVideoUri = `stub://video_${questionIndex}_${Date.now()}.mp4`;
            setVideoAnswers(prev => ({
              ...prev,
              [questionIndex]: stubVideoUri,
            }));
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleRetake = (questionIndex: number) => {
    const newAnswers = { ...videoAnswers };
    delete newAnswers[questionIndex];
    setVideoAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    const allAnswered = foundItem.questions.every((_, index) => 
      videoAnswers[index] !== undefined
    );

    if (!allAnswered) {
      Alert.alert('Incomplete', 'Please record video answers for all questions');
      return;
    }

    try {
      setLoading(true);

      // Build video answers array
      const ownerVideoAnswers: VideoAnswer[] = foundItem.questions.map((question, index) => ({
        question,
        videoUrl: videoAnswers[index],
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
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Record Video Answers</Text>
            <Text style={styles.subtitle}>
              Record a short video (max 5 seconds) answering each question
            </Text>
          </View>

          <View style={styles.questionsContainer}>
            {foundItem.questions.map((question, index) => (
              <View key={index} style={styles.questionCard}>
                <Text style={styles.questionNumber}>Question {index + 1}</Text>
                <Text style={styles.questionText}>{question}</Text>

                {videoAnswers[index] ? (
                  <View style={styles.videoPreview}>
                    <Text style={styles.videoPreviewText}>✓ Video recorded</Text>
                    <TouchableOpacity 
                      style={styles.retakeButton}
                      onPress={() => handleRetake(index)}
                    >
                      <Text style={styles.retakeText}>Retake</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.recordButton}
                    onPress={() => handleRecordVideo(index)}
                  >
                    <Text style={styles.recordIcon}>🎥</Text>
                    <Text style={styles.recordText}>Record Video Answer</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              📹 Tips for recording:
            </Text>
            <Text style={styles.infoText}>• Speak clearly and confidently</Text>
            <Text style={styles.infoText}>• Show your face (selfie video)</Text>
            <Text style={styles.infoText}>• Keep answers under 5 seconds</Text>
            <Text style={styles.infoText}>• Answer honestly to verify ownership</Text>
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
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#4A90E2',
    borderStyle: 'dashed',
  },
  recordIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  recordText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90E2',
  },
  videoPreview: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videoPreviewText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  retakeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  retakeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
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
