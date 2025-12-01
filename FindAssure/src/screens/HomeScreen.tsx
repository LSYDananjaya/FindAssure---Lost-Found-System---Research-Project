import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types/models';
import { PrimaryButton } from '../components/PrimaryButton';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user, signOut } = useAuth();

  const handleReportFound = () => {
    navigation.navigate('ReportFoundStart');
  };

  const handleFindLost = () => {
    if (!user) {
      // Redirect to login if not logged in
      navigation.navigate('Login');
    } else {
      navigation.navigate('FindLostStart');
    }
  };

  const handleAdminLogin = () => {
    navigation.navigate('AdminLogin');
  };

  const handleProfile = () => {
    navigation.navigate('Profile');
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#4A90E2', '#67B5E8', '#8DCFF5']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>🔍</Text>
          </View>
          <Text style={styles.appTitle}>FIND ASSURE</Text>
          <Text style={styles.tagline}>Your Lost & Found System</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Auth Status Section */}
        <View style={styles.authSection}>
          {user ? (
            <View style={styles.userCard}>
              <Text style={styles.greeting}>Welcome back, {user.name}! 👋</Text>
              <Text style={styles.userRole}>Role: {user.role}</Text>
              <View style={styles.userActions}>
                <TouchableOpacity style={styles.linkButton} onPress={handleProfile}>
                  <Text style={styles.linkText}>View Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.linkButton} onPress={handleLogout}>
                  <Text style={styles.linkText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.guestCard}>
              <Text style={styles.guestText}>Not logged in</Text>
              <PrimaryButton
                title="Login / Register"
                onPress={handleLogin}
                style={styles.authButton}
              />
            </View>
          )}
        </View>

        {/* Main Action Cards */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>What would you like to do?</Text>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={handleReportFound}
            activeOpacity={0.7}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionEmoji}>📢</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Report a Found Item</Text>
              <Text style={styles.actionDescription}>
                Help someone by reporting an item you found
              </Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={handleFindLost}
            activeOpacity={0.7}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionEmoji}>🔎</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Find Lost Item</Text>
              <Text style={styles.actionDescription}>
                Search for your lost items {!user && '(Login required)'}
              </Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Admin Access */}
        <View style={styles.adminSection}>
          <TouchableOpacity 
            style={styles.adminLink}
            onPress={handleAdminLogin}
          >
            <Text style={styles.adminLinkText}>🔒 Admin Login</Text>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How It Works</Text>
          <View style={styles.infoStep}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.stepText}>Report found items with photos and details</Text>
          </View>
          <View style={styles.infoStep}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.stepText}>Owners search and verify ownership</Text>
          </View>
          <View style={styles.infoStep}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.stepText}>Connect and reunite with lost belongings</Text>
          </View>
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
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 40,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.95,
  },
  content: {
    padding: 20,
  },
  authSection: {
    marginBottom: 24,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  userActions: {
    flexDirection: 'row',
    gap: 16,
  },
  linkButton: {
    paddingVertical: 8,
  },
  linkText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '600',
  },
  guestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  guestText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  authButton: {
    width: '100%',
  },
  actionsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionEmoji: {
    fontSize: 28,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  arrow: {
    fontSize: 32,
    color: '#CCCCCC',
    fontWeight: '300',
  },
  adminSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  adminLink: {
    paddingVertical: 12,
  },
  adminLinkText: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  infoStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4A90E2',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 32,
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
});

export default HomeScreen;
