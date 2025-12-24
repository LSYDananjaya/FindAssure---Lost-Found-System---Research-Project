import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/models';
import { PrimaryButton } from '../../components/PrimaryButton';
import axiosClient from '../../api/axiosClient';

type VerificationResultRouteProp = RouteProp<RootStackParamList, 'VerificationResult'>;
type VerificationResultNavigationProp = StackNavigationProp<RootStackParamList, 'VerificationResult'>;

interface VerificationResult {
  question_id: number;
  final_similarity: string;
  status: 'match' | 'partial_match' | 'mismatch';
  local_explanation: string;
  gemini_analysis: string | null;
}

interface PythonVerificationResponse {
  final_confidence: string;
  is_absolute_owner: boolean;
  gemini_recommendation: string;
  gemini_reasoning: string;
  results: VerificationResult[];
}

interface VerificationData {
  _id: string;
  status: 'pending' | 'passed' | 'failed';
  similarityScore: number | null;
  pythonVerificationResult?: PythonVerificationResponse;
  foundItemId: {
    _id: string;
    category: string;
    description: string;
    imageUrl: string;
    location: string;
    founderContact: {
      name: string;
      email: string;
      phone: string;
    };
  };
}

const VerificationResultScreen = () => {
  const route = useRoute<VerificationResultRouteProp>();
  const navigation = useNavigation<VerificationResultNavigationProp>();
  const { verificationId } = route.params;

  const [loading, setLoading] = useState(true);
  const [verification, setVerification] = useState<VerificationData | null>(null);

  useEffect(() => {
    fetchVerificationResult();
  }, []);

  const fetchVerificationResult = async () => {
    try {
      const response = await axiosClient.get(`/items/verification/${verificationId}`);
      setVerification(response.data);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to fetch verification result');
    } finally {
      setLoading(false);
    }
  };

  const handleGoHome = () => {
    navigation.navigate('Home');
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading verification result...</Text>
      </View>
    );
  }

  if (!verification) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load verification result</Text>
        <PrimaryButton title="Go Home" onPress={handleGoHome} />
      </View>
    );
  }

  const pythonResult = verification.pythonVerificationResult;
  const isVerified = verification.status === 'passed' && pythonResult?.is_absolute_owner;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Status Header */}
        <View style={[styles.statusCard, isVerified ? styles.successCard : styles.failureCard]}>
          <Text style={styles.statusIcon}>{isVerified ? '✅' : '❌'}</Text>
          <Text style={styles.statusTitle}>
            {isVerified ? 'Verification Successful!' : 'Verification Failed'}
          </Text>
          <Text style={styles.statusMessage}>
            {isVerified
              ? 'You have been verified as the owner of this item'
              : 'Your answers did not match sufficiently. This may not be your item.'}
          </Text>
        </View>

        {/* Verification Score */}
        {pythonResult && (
          <View style={styles.scoreCard}>
            <Text style={styles.scoreTitle}>Confidence Score</Text>
            <Text style={styles.scoreValue}>{pythonResult.final_confidence}</Text>
            <Text style={styles.scoreLabel}>
              {pythonResult.gemini_recommendation}
            </Text>
          </View>
        )}

        {/* AI Reasoning */}
        {pythonResult?.gemini_reasoning && (
          <View style={styles.reasoningCard}>
            <Text style={styles.reasoningTitle}>AI Analysis</Text>
            <Text style={styles.reasoningText}>{pythonResult.gemini_reasoning}</Text>
          </View>
        )}

        {/* Founder Contact Info - Only show if verified */}
        {isVerified && verification.foundItemId.founderContact && (
          <View style={styles.contactCard}>
            <Text style={styles.contactTitle}>🎉 Founder Contact Information</Text>
            <View style={styles.contactInfo}>
              <View style={styles.contactRow}>
                <Text style={styles.contactLabel}>Name:</Text>
                <Text style={styles.contactValue}>{verification.foundItemId.founderContact.name}</Text>
              </View>
              <View style={styles.contactRow}>
                <Text style={styles.contactLabel}>Email:</Text>
                <Text style={styles.contactValue}>{verification.foundItemId.founderContact.email}</Text>
              </View>
              <View style={styles.contactRow}>
                <Text style={styles.contactLabel}>Phone:</Text>
                <Text style={styles.contactValue}>{verification.foundItemId.founderContact.phone}</Text>
              </View>
            </View>
            <Text style={styles.contactInstructions}>
              Please contact the finder to arrange retrieval of your item.
            </Text>
          </View>
        )}

        {/* Item Details */}
        <View style={styles.itemCard}>
          <Text style={styles.itemTitle}>Item Details</Text>
          <View style={styles.itemDetail}>
            <Text style={styles.itemLabel}>Category:</Text>
            <Text style={styles.itemValue}>{verification.foundItemId.category}</Text>
          </View>
          <View style={styles.itemDetail}>
            <Text style={styles.itemLabel}>Location:</Text>
            <Text style={styles.itemValue}>{verification.foundItemId.location}</Text>
          </View>
        </View>

        {/* Question Results */}
        {pythonResult?.results && pythonResult.results.length > 0 && (
          <View style={styles.resultsCard}>
            <Text style={styles.resultsTitle}>Question Analysis</Text>
            {pythonResult.results.map((result, index) => (
              <View key={result.question_id} style={styles.resultItem}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultNumber}>Q{result.question_id}</Text>
                  <Text style={styles.resultSimilarity}>{result.final_similarity}</Text>
                  <View style={[
                    styles.resultStatus,
                    result.status === 'match' && styles.statusMatch,
                    result.status === 'partial_match' && styles.statusPartial,
                    result.status === 'mismatch' && styles.statusMismatch,
                  ]}>
                    <Text style={styles.resultStatusText}>
                      {result.status === 'match' ? '✓ Match' : 
                       result.status === 'partial_match' ? '~ Partial' : '✗ Mismatch'}
                    </Text>
                  </View>
                </View>
                {result.gemini_analysis && (
                  <Text style={styles.resultAnalysis}>{result.gemini_analysis}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          {!isVerified && (
            <Text style={styles.tryAgainText}>
              If you believe this is your item, you can try again with more accurate answers.
            </Text>
          )}
          <PrimaryButton title="Back to Home" onPress={handleGoHome} />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 24,
    textAlign: 'center',
  },
  statusCard: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  successCard: {
    backgroundColor: '#D1FAE5',
  },
  failureCard: {
    backgroundColor: '#FEE2E2',
  },
  statusIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  scoreCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreTitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  reasoningCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reasoningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1F2937',
  },
  reasoningText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  contactCard: {
    backgroundColor: '#EFF6FF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1F2937',
    textAlign: 'center',
  },
  contactInfo: {
    marginBottom: 16,
  },
  contactRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  contactLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    width: 80,
  },
  contactValue: {
    fontSize: 16,
    color: '#2563EB',
    flex: 1,
  },
  contactInstructions: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1F2937',
  },
  itemDetail: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    width: 100,
  },
  itemValue: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  resultsCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1F2937',
  },
  resultItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginRight: 12,
  },
  resultSimilarity: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563EB',
    marginRight: 12,
  },
  resultStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusMatch: {
    backgroundColor: '#D1FAE5',
  },
  statusPartial: {
    backgroundColor: '#FEF3C7',
  },
  statusMismatch: {
    backgroundColor: '#FEE2E2',
  },
  resultStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resultAnalysis: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  actions: {
    marginBottom: 40,
  },
  tryAgainText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
});

export default VerificationResultScreen;
