// AnswerQuestionsVideoScreen – Video recording with 5-second limit, preview, and retake
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
import { RootStackParamList, OwnerAnswerInput } from '../../types/models';
import { PrimaryButton } from '../../components/PrimaryButton';
import { itemsApi } from '../../api/itemsApi';
import { VideoRecorder } from '../../components/VideoRecorder';

type AnswerQuestionsVideoNavigationProp = StackNavigationProp<RootStackParamList, 'AnswerQuestionsVideo'>;
type AnswerQuestionsVideoRouteProp = RouteProp<RootStackParamList, 'AnswerQuestionsVideo'>;

const AnswerQuestionsVideoScreen = () => {
  const navigation = useNavigation<AnswerQuestionsVideoNavigationProp>();
  const route = useRoute<AnswerQuestionsVideoRouteProp>();
  const { foundItem } = route.params;

  // Store text answers for each question
  const [textAnswers, setTextAnswers] = useState<string[]>(
    new Array(foundItem.questions.length).fill('')
  );
  // Store video URIs for each question
  const [videoAnswers, setVideoAnswers] = useState<(string | null)[]>(
    new Array(foundItem.questions.length).fill(null)
  );
  // Track which question is being recorded
  const [recordingQuestionIndex, setRecordingQuestionIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnswerChange = (index: number, text: string) => {
    const newAnswers = [...textAnswers];
    newAnswers[index] = text;
    setTextAnswers(newAnswers);
  };

  const handleRecordVideo = (index: number) => {
    setRecordingQuestionIndex(index);
  };

  const handleVideoRecorded = (videoUri: string) => {
    if (recordingQuestionIndex !== null) {
      const newVideoAnswers = [...videoAnswers];
      newVideoAnswers[recordingQuestionIndex] = videoUri;
      setVideoAnswers(newVideoAnswers);
      setRecordingQuestionIndex(null);
    }
  };

  const handleCancelRecording = () => {
    setRecordingQuestionIndex(null);
  };

  const handleRemoveVideo = (index: number) => {
    const newVideoAnswers = [...videoAnswers];
    newVideoAnswers[index] = null;
    setVideoAnswers(newVideoAnswers);
  };

  const handleSubmit = async () => {
    // Check if all questions have either text or video answers
    const allAnswered = textAnswers.every((answer, index) => 
      answer.trim().length > 0 || videoAnswers[index] !== null
    );

    if (!allAnswered) {
      Alert.alert('Incomplete', 'Please answer all questions with either text or video');
      return;
    }

    try {
      setLoading(true);

      // Build unified owner answers array with questionId, answer, and videoKey
      // Note: Video URIs are stored temporarily and will be sent to Python backend in future
      const ownerAnswers: OwnerAnswerInput[] = textAnswers.map((answer, index) => ({
        questionId: index,
        answer: videoAnswers[index] ? `[Video Answer: ${videoAnswers[index]}]` : answer.trim(),
        videoKey: videoAnswers[index] || 'default_video_placeholder',
      }));

      // Submit verification request
      const response = await itemsApi.submitVerification({
        foundItemId: foundItem._id,
        ownerAnswers,
      });

      // Navigate to verification result screen with the verification ID
      navigation.navigate('VerificationResult', { 
        verificationId: response._id 
      });
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
              Answer each question with video or text to verify your ownership
            </Text>
          </View>

          <View style={styles.questionsContainer}>
            {foundItem.questions.map((question, index) => (
              <View key={index} style={styles.questionCard}>
                <Text style={styles.questionNumber}>Question {index + 1}</Text>
                <Text style={styles.questionText}>{question}</Text>

                {/* Video Answer Section */}
                {videoAnswers[index] ? (
                  <View style={styles.videoAnswerContainer}>
                    <View style={styles.videoRecordedBadge}>
                      <Text style={styles.videoRecordedIcon}>✓</Text>
                      <Text style={styles.videoRecordedText}>Video Answer Recorded</Text>
                    </View>
                    <View style={styles.videoActions}>
                      <TouchableOpacity 
                        style={styles.viewVideoButton}
                        onPress={() => handleRecordVideo(index)}
                      >
                        <Text style={styles.viewVideoText}>👁 View/Retake</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.removeVideoButton}
                        onPress={() => handleRemoveVideo(index)}
                      >
                        <Text style={styles.removeVideoText}>🗑 Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <>
                    {/* Video Recording Button */}
                    <TouchableOpacity 
                      style={styles.recordButton}
                      onPress={() => handleRecordVideo(index)}
                    >
                      <Text style={styles.recordIcon}>🎥</Text>
                      <Text style={styles.recordText}>Record Video Answer (Max 5s)</Text>
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
                  </>
                )}
              </View>
            ))}
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              📝 Answer Tips:
            </Text>
            <Text style={styles.infoText}>• Record a video (max 5 seconds) or type your answer</Text>
            <Text style={styles.infoText}>• Be specific and accurate</Text>
            <Text style={styles.infoText}>• Provide details only the true owner would know</Text>
            <Text style={styles.infoText}>• You can preview and retake videos before submitting</Text>
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

      {/* Video Recorder Modal */}
      {recordingQuestionIndex !== null && (
        <VideoRecorder
          questionNumber={recordingQuestionIndex + 1}
          onVideoRecorded={handleVideoRecorded}
          onCancel={handleCancelRecording}
        />
      )}
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
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  recordIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  recordText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  videoAnswerContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 16,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  videoRecordedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  videoRecordedIcon: {
    fontSize: 18,
    color: '#4CAF50',
    marginRight: 8,
  },
  videoRecordedText: {
    fontSize: 15,
    color: '#2E7D32',
    fontWeight: '600',
  },
  videoActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewVideoButton: {
    flex: 1,
    backgroundColor: '#4A90E2',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewVideoText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  removeVideoButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  removeVideoText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
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
