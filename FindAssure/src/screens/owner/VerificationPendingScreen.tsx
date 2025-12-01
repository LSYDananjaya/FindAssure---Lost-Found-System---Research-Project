// VerificationPendingScreen – follow the spec
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/models';
import { PrimaryButton } from '../../components/PrimaryButton';

type VerificationPendingNavigationProp = StackNavigationProp<RootStackParamList, 'VerificationPending'>;

const VerificationPendingScreen = () => {
  const navigation = useNavigation<VerificationPendingNavigationProp>();

  const handleGoHome = () => {
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>⏳</Text>
        </View>

        <Text style={styles.title}>Verification Pending</Text>
        <Text style={styles.message}>
          Your answers have been submitted
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>What's Next?</Text>
          <Text style={styles.infoText}>
            1. Your video answers are being processed
          </Text>
          <Text style={styles.infoText}>
            2. Our AI system will verify your responses
          </Text>
          <Text style={styles.infoText}>
            3. If verification passes, you'll receive the founder's contact information
          </Text>
          <Text style={styles.infoText}>
            4. You'll be notified via email about the verification result
          </Text>
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            ⚠️ Please note: This process may take a few minutes to a few hours. 
            You will be notified once verification is complete.
          </Text>
        </View>

        <PrimaryButton
          title="Back to Home"
          onPress={handleGoHome}
          style={styles.button}
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
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    width: '100%',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 22,
    marginBottom: 6,
  },
  warningBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningText: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 20,
    textAlign: 'center',
  },
  button: {
    width: '100%',
  },
});

export default VerificationPendingScreen;
