//CODE ATTRIBUTION
//01
//Axios HTTP Client Library
//Adapted from: npm. (2025). axios. [online] npm Package Registry.
//Available at: https://www.npmjs.com/package/axios
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//02
//Axios Request and Response Interceptors
//Adapted from: axios-http.com. (2025). Interceptors. [online] Axios Documentation.
//Available at: https://axios-http.com/docs/interceptors
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//03
//JWT Token Authentication with Axios
//Adapted from: OWASP. (2025). JSON Web Token Cheat Sheet. [online] OWASP Cheat Sheet Series.
//Available at: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//04
//LocalStorage Security Considerations
//Adapted from: OWASP. (2025). HTML5 Security Cheat Sheet. [online] OWASP Cheat Sheet Series.
//Available at: https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#local-storage
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//05
//HTTP Error Handling and Retry Logic
//Adapted from: axios-http.com. (2025). Handling Errors. [online] Axios Documentation.
//Available at: https://axios-http.com/docs/handling_errors
//Date Accessed: 10 October 2025

import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Smart API URL detection with protocol awareness
const detectAPIUrl = () => {
  const httpUrl = 'http://localhost:5000/api';
  const httpsUrl = 'https://localhost:5000/api';

  // Environment override takes precedence
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Prefer matching the current page protocol to avoid mixed content
  if (typeof window !== 'undefined' && window.location?.protocol === 'https:') {
    return httpsUrl;
  }

  // Default to HTTP in local dev
  return httpUrl;
};

const API_BASE_URL = detectAPIUrl();

// Log the API URL for debugging
console.log('🔗 API Base URL:', API_BASE_URL);

// Create axios instance with error handling
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Attach anti-MITM security token if present
    const securityToken = localStorage.getItem('securityToken');
    if (securityToken) {
      (config.headers as any)['X-Security-Token'] = securityToken;
    }
    // If no security token and this is not a GET request, try to bootstrap it first
    // by making a GET request to get the token (only for critical POST requests)
    // Actually, we'll let the middleware handle this - it will provide a token in response
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Smart retry logic for protocol fallback (HTTP <-> HTTPS)
api.interceptors.response.use(
  (response) => {
    // Update anti-MITM token from response header if provided
    const newToken = response.headers['x-security-token'];
    if (newToken) {
      localStorage.setItem('securityToken', newToken as string);
    }
    return response;
  },
  async (error) => {
    const currentUrl = api.defaults.baseURL || '';
    const isHttps = currentUrl.startsWith('https://');

    const shouldRetryNetwork =
      !error.response &&
      (error.code === 'ECONNREFUSED' ||
        error.code === 'CERT_HAS_EXPIRED' ||
        error.code === 'ERR_NETWORK' ||
        error.message?.toLowerCase().includes('network'));

    // Avoid infinite retry loops
    const originalConfig = error.config || {};
    if (shouldRetryNetwork && !originalConfig.__protocolRetried) {
      originalConfig.__protocolRetried = true;

      if (isHttps) {
        console.log('🔄 HTTPS failed, falling back to HTTP...');
        api.defaults.baseURL = currentUrl.replace('https://', 'http://');
      } else if (currentUrl.startsWith('http://')) {
        console.log('🔄 HTTP failed, trying HTTPS...');
        api.defaults.baseURL = currentUrl.replace('http://', 'https://');
      }

      return api.request(originalConfig);
    }
    
    // Handle anti-MITM 403s by clearing token and retrying once
    if (error.response?.status === 403 && error.response?.data?.error?.includes('security token')) {
      localStorage.removeItem('securityToken');
      // If this is a POST request without a token, the middleware will now allow it
      // and provide a token in the response, so we can retry
      const originalConfig = error.config || {};
      if (!originalConfig.__securityTokenRetried && originalConfig.method !== 'get') {
        originalConfig.__securityTokenRetried = true;
        // Remove the failed token header and retry
        delete originalConfig.headers['X-Security-Token'];
        return api.request(originalConfig);
      }
    }

    // Handle auth errors
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      // Don't redirect on login page - let the error be displayed
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // Log error details for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL
        }
      });
    }
    
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
  }) => api.post('/auth/register', userData),

  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),

  logout: () => api.post('/auth/logout'),

  getProfile: () => api.get('/auth/profile'),

  updateProfile: (profileData: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  }) => api.put('/auth/profile', profileData),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),

  changePassword: (passwords: {
    currentPassword: string;
    password: string;
  }) => api.post('/auth/change-password', passwords),
};

// Dashboard API endpoints
export const dashboardAPI = {
  getDashboard: () => api.get('/dashboard'),
};

// Payment API endpoints
export const paymentAPI = {
  createPayment: (paymentData: {
    amount: number;
    currency: string;
    recipient: string;
    paymentProvider: string;
  }) => api.post('/payment/create', paymentData),
};

// Health check
export const healthAPI = {
  checkHealth: () => {
    const base = (api.defaults.baseURL || API_BASE_URL).replace('/api', '');
    return axios.get(`${base}/health`);
  },
};

export default api;
