import React, { createContext, useState, useEffect, useContext } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeAuth,
  getReactNativePersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  getAuth,
  User as FirebaseUser 
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosClient from '../api/axiosClient';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB-wfz-2qgTCE0moQL-lVWNpWVKVYwiMHc",
  authDomain: "findazzure.firebaseapp.com",
  projectId: "findazzure",
  storageBucket: "findazzure.firebasestorage.app",
  messagingSenderId: "804114580108",
  appId: "1:804114580108:web:0e471566a61b785a6331a9",
  measurementId: "G-YKXTBZ6L6M"
};

// Initialize Firebase (prevent re-initialization)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with AsyncStorage persistence (prevent re-initialization)
let auth;
try {
  // Try to get existing auth instance first
  auth = getAuth(app);
} catch (error) {
  // If it doesn't exist, initialize it
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'owner' | 'founder' | 'admin';
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  token: string | null;
  loading: boolean;
  signIn: (credentials: { email: string; password: string }) => Promise<void>;
  signUp: (data: { email: string; password: string; name: string; phone?: string; role?: 'owner' | 'founder' }) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<User>;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync user with backend
  const syncUserWithBackend = async (firebaseUser: FirebaseUser) => {
    try {
      const idToken = await firebaseUser.getIdToken();
      setToken(idToken);

      // Set token for axios requests
      axiosClient.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;

      // ✅ Call backend - user will be auto-created in MongoDB if doesn't exist
      const response = await axiosClient.get('/auth/me');
      setUser(response.data);
      
    } catch (error: any) {
      console.error('Error syncing with backend:', error);
      
      // Provide helpful error messages
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.error('⚠️ Backend connection timeout. Make sure backend server is running and the IP address is correct.');
      } else if (error.code === 'ERR_NETWORK') {
        console.error('⚠️ Network error. Check your connection and backend IP address.');
      }
      
      // Don't block login, user can still access app with Firebase auth
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        await syncUserWithBackend(firebaseUser);
      } else {
        setUser(null);
        setToken(null);
      }
    });

    return unsubscribe;
  }, []);

  const signUp = async (data: { email: string; password: string; name: string; phone?: string; role?: 'owner' | 'founder' }) => {
    try {
      const { email, password, name, phone, role } = data;
      
      // 1. Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // 2. Get token
      const idToken = await userCredential.user.getIdToken();
      setToken(idToken);

      // 3. Register with backend (creates MongoDB user with all details)
      const registerData: any = { email, name };
      if (phone) registerData.phone = phone;
      if (role) registerData.role = role;
      
      await axiosClient.post('/auth/register', registerData, {
        headers: { Authorization: `Bearer ${idToken}` }
      });

      // 4. Refresh user data
      await syncUserWithBackend(userCredential.user);
      
    } catch (error: any) {
      console.error('Sign up error:', error);
      
      // Handle specific error cases with user-friendly messages
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered. Please sign in instead.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters long.');
      } else if (error.response?.status === 409) {
        throw new Error('This account already exists. Please sign in instead.');
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('Connection timeout. Please check your internet connection and try again.');
      } else if (error.code === 'ERR_NETWORK') {
        throw new Error('Cannot connect to server. Please check if backend is running.');
      }
      
      throw new Error(error.response?.data?.message || error.message || 'Sign up failed');
    }
  };

  const signIn = async (credentials: { email: string; password: string }) => {
    try {
      const { email, password } = credentials;
      
      // 1. Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // 2. Sync with backend
      await syncUserWithBackend(userCredential.user);
      
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      // Handle specific error cases with user-friendly messages
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email. Please sign up first.');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      } else if (error.code === 'auth/user-disabled') {
        throw new Error('This account has been disabled.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please try again later.');
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('Connection timeout. Please check your internet connection.');
      } else if (error.code === 'ERR_NETWORK') {
        throw new Error('Cannot connect to server. Please check if backend is running.');
      }
      
      throw new Error(error.response?.data?.message || error.message || 'Sign in failed');
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setToken(null);
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error(error.message || 'Sign out failed');
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const response = await axiosClient.patch('/auth/me', data);
      // Update local user state with the response
      setUser(response.data);
      return response.data;
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Update failed');
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      firebaseUser, 
      token, 
      loading, 
      signIn, 
      signUp, 
      signOut, 
      updateProfile,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export { auth };