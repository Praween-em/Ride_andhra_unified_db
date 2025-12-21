import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Environment-specific API URLs
const getApiUrl = () => {
  // Check if we have a custom API URL from EAS build
  const customApiUrl = Constants.expoConfig?.extra?.apiUrl;
  if (customApiUrl) {
    return customApiUrl;
  }

  // Check environment variable
  const envApiUrl = process.env.local_url;
  if (envApiUrl) {
    return envApiUrl;
  }

  //Default to local development
  if (__DEV__) {
    return 'http://192.168.29.18:8082'; // Development - change to your local IP
  }

  // FORCING LOCAL DEVELOPMENT URL
  return 'http://192.168.29.18:8082';

  //Production fallback
  return 'https://ride-andhra-unified-db.onrender.com'; // CHANGE THIS for production
};

const API_BASE_URL = getApiUrl();

console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
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
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('token');
      // You might want to navigate to login screen here
    }
    return Promise.reject(error);
  }
);

export const API_URL = API_BASE_URL;
export default api;
