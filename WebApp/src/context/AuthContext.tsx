import React, { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../config/firebase';
import apiClient from '../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'owner' | 'admin';
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  token: string | null;
  loading: boolean;
  signIn: (credentials: { email: string; password: string }) => Promise<void>;
  signUp: (data: { email: string; password: string; name: string; phone?: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;

      // Store token in localStorage
      localStorage.setItem('authToken', idToken);

      // Call backend to get/create user in MongoDB
      const response = await apiClient.get('/auth/me');
      setUser(response.data);
    } catch (error: any) {
      console.error('Error syncing with backend:', error);
      
      // If user doesn't exist in backend, they need to complete registration
      if (error.response?.status === 404) {
        console.log('User not found in backend, needs registration');
      }
    }
  };

  useEffect(() => {
    // Check for stored token
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        await syncUserWithBackend(firebaseUser);
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem('authToken');
        delete apiClient.defaults.headers.common['Authorization'];
      }
    });

    return unsubscribe;
  }, []);

  const signUp = async (data: { email: string; password: string; name: string; phone?: string }) => {
    try {
      const { email, password, name, phone } = data;
      
      // 1. Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // 2. Get token
      const idToken = await userCredential.user.getIdToken();
      setToken(idToken);

      // 3. Register with backend (creates MongoDB user)
      const registerData: any = { email, name };
      if (phone) registerData.phone = phone;
      
      try {
        await apiClient.post('/auth/register', registerData, {
          headers: { Authorization: `Bearer ${idToken}` }
        });
      } catch (backendError: any) {
        if (backendError.response?.status === 409) {
          console.log('User already exists in backend');
        } else {
          console.error('Backend registration error:', backendError);
        }
      }

      // 4. Sync user data
      await syncUserWithBackend(userCredential.user);
      
    } catch (error: any) {
      console.error('Sign up error:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered. Please sign in instead.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters long.');
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
      
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email. Please sign up first.');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      } else if (error.code === 'auth/invalid-credential') {
        throw new Error('Invalid email or password. Please try again.');
      }
      
      throw new Error(error.response?.data?.message || error.message || 'Sign in failed');
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setToken(null);
      localStorage.removeItem('authToken');
      delete apiClient.defaults.headers.common['Authorization'];
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error(error.message || 'Sign out failed');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      firebaseUser, 
      token, 
      loading, 
      signIn, 
      signUp, 
      signOut
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
