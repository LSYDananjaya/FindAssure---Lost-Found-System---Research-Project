// ReportFoundSuccessScreen – follow the spec
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/models';
import { PrimaryButton } from '../../components/PrimaryButton';

type ReportFoundSuccessNavigationProp = StackNavigationProp<RootStackParamList, 'ReportFoundSuccess'>;

const ReportFoundSuccessScreen = () => {
  const navigation = useNavigation<ReportFoundSuccessNavigationProp>();

  const handleGoHome = () => {
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>✅</Text>
        </View>

        <Text style={styles.title}>Success!</Text>
        <Text style={styles.message}>
          Found item reported successfully
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Thank you for helping someone find their lost item! 
          </Text>
          <Text style={styles.infoText}>
            The owner will need to verify their ownership by answering your questions 
            before they can see your contact information.
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
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  message: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    width: '100%',
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  button: {
    width: '100%',
  },
});

export default ReportFoundSuccessScreen;
