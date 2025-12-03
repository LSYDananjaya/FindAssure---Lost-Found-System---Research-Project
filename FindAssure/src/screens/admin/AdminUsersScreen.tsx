// AdminUsersScreen – User Management for Admin
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  RefreshControl, 
  TouchableOpacity,
  ActivityIndicator 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, User } from '../../types/models';
import { adminApi } from '../../api/adminApi';
import { PrimaryButton } from '../../components/PrimaryButton';

type AdminUsersNavigationProp = StackNavigationProp<RootStackParamList, 'AdminUsers'>;

const AdminUsersScreen = () => {
  const navigation = useNavigation<AdminUsersNavigationProp>();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const usersData = await adminApi.getAllUsers();
      setUsers(usersData);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleDeleteUser = (user: User) => {
    if (user.role === 'admin') {
      Alert.alert('Cannot Delete', 'Admin users cannot be deleted for security reasons.');
      return;
    }

    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.name || user.email}?\n\nThis will permanently remove the user from both MongoDB and Firebase.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDelete(user),
        },
      ]
    );
  };

  const confirmDelete = async (user: User) => {
    setDeletingUserId(user._id);
    try {
      await adminApi.deleteUser(user._id);
      
      Alert.alert(
        'Success',
        `User ${user.name || user.email} has been deleted successfully.`,
        [{ text: 'OK' }]
      );
      
      // Remove user from local state
      setUsers(prevUsers => prevUsers.filter(u => u._id !== user._id));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete user');
    } finally {
      setDeletingUserId(null);
    }
  };

  const renderUserCard = (user: User) => {
    const isDeleting = deletingUserId === user._id;
    const isAdmin = user.role === 'admin';

    return (
      <View key={user._id} style={styles.userCard}>
        <View style={styles.userInfo}>
          <View style={styles.userHeader}>
            <Text style={styles.userName}>{user.name || 'No Name'}</Text>
            <View style={[
              styles.roleBadge,
              isAdmin ? styles.adminBadge : styles.ownerBadge
            ]}>
              <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
            </View>
          </View>
          
          <Text style={styles.userEmail}>{user.email}</Text>
          {user.phone && <Text style={styles.userPhone}>📱 {user.phone}</Text>}
          
          <Text style={styles.userDate}>
            Joined: {new Date(user.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.actionButtons}>
          {!isAdmin && (
            <TouchableOpacity
              style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
              onPress={() => handleDeleteUser(user)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.deleteButtonText}>Delete</Text>
              )}
            </TouchableOpacity>
          )}
          {isAdmin && (
            <View style={styles.protectedLabel}>
              <Text style={styles.protectedText}>Protected</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>User Management</Text>
            <Text style={styles.subtitle}>Total Users: {users.length}</Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {users.filter(u => u.role === 'admin').length}
              </Text>
              <Text style={styles.statLabel}>Admins</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {users.filter(u => u.role === 'owner').length}
              </Text>
              <Text style={styles.statLabel}>Owners</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All Users</Text>
            {users.map(user => renderUserCard(user))}
            
            {users.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No users found</Text>
              </View>
            )}
          </View>

          <PrimaryButton
            title="Back to Dashboard"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
        </View>
      </ScrollView>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 12,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  userCard: {
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
  userInfo: {
    marginBottom: 12,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminBadge: {
    backgroundColor: '#FF6B6B',
  },
  ownerBadge: {
    backgroundColor: '#4A90E2',
  },
  roleText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  userDate: {
    fontSize: 12,
    color: '#999999',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deleteButton: {
    backgroundColor: '#E53935',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  protectedLabel: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  protectedText: {
    color: '#999999',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999999',
  },
  backButton: {
    marginTop: 10,
  },
});

export default AdminUsersScreen;
