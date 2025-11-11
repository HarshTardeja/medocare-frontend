import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'sonner';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Handle 401 errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Remove invalid token
      Cookies.remove('access_token');
      Cookies.remove('user');
      
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
      
      return Promise.reject(error);
    }

    // Handle other errors
    if (error.response?.status >= 400) {
      let message = 'An error occurred';
      
      if (error.response.data?.detail) {
        // Handle validation errors (array of error objects)
        if (Array.isArray(error.response.data.detail)) {
          message = error.response.data.detail.map((err: any) => err.msg || err.message).join(', ');
        } else if (typeof error.response.data.detail === 'string') {
          message = error.response.data.detail;
        } else {
          message = 'Validation error occurred';
        }
      } else if (error.response.data?.message) {
        message = error.response.data.message;
      }
      
      // Show error toast
      if (typeof window !== 'undefined') {
        toast.error(message);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Helper function to set auth token
export const setAuthToken = (token: string) => {
  Cookies.set('access_token', token, { expires: 7 }); // 7 days
};

// Helper function to remove auth token
export const removeAuthToken = () => {
  Cookies.remove('access_token');
  Cookies.remove('user');
};

// Helper function to get auth token
export const getAuthToken = () => {
  return Cookies.get('access_token');
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getAuthToken();
};