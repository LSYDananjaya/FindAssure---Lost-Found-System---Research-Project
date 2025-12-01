import axios from 'axios';
import { BASE_URL, API_CONFIG } from '../config/api.config';

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: API_CONFIG.REQUEST_TIMEOUT,
});

// Request interceptor to attach auth token
axiosClient.interceptors.request.use(
  (config) => {
    // Token will be set by AuthContext when user logs in
    // Access token from AsyncStorage or global state
    const token = (global as any).authToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      console.log('Unauthorized - token expired or invalid');
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
