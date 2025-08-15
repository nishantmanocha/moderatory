import axios from 'axios';

// Auto-detect backend URL
const getBaseURL = () => {
  // For development, try to detect local IP
  // In production, this would be set from environment variables
  if (__DEV__) {
    // Default to localhost for web development
    return 'http://localhost:3000';
  }
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('🚨 API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('🚨 API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// User API
export const userAPI = {
  setup: async (userData: {
    phone: string;
    name: string;
    monthly_income: number;
    monthly_rent?: number;
    monthly_emi?: number;
    savings_goal?: number;
    language?: string;
  }) => {
    const response = await api.post('/user/setup', userData);
    return response.data;
  },

  getProfile: async (userId: number) => {
    const response = await api.get(`/user/${userId}`);
    return response.data;
  },

  getByPhone: async (phone: string) => {
    const response = await api.get(`/user?phone=${phone}`);
    return response.data;
  },
};

// Transactions API
export const transactionsAPI = {
  getAll: async (userId: number, limit = 100) => {
    const response = await api.get(`/transactions/${userId}?limit=${limit}`);
    return response.data;
  },

  getWeekly: async (userId: number) => {
    const response = await api.get(`/transactions/${userId}/week`);
    return response.data;
  },

  add: async (transactionData: {
    user_id: number;
    amount: number;
    category: string;
    merchant: string;
    description: string;
    date?: string;
  }) => {
    const response = await api.post('/transactions/add', transactionData);
    return response.data;
  },

  updateCategory: async (transactionId: number, category: string) => {
    const response = await api.put(`/transactions/${transactionId}`, { category });
    return response.data;
  },

  generateFresh: async (userId: number, count = 25) => {
    const response = await api.post(`/transactions/${userId}/generate-fresh`, { count });
    return response.data;
  },
};

// Analytics API
export const analyticsAPI = {
  getSafeSave: async (userId: number) => {
    const response = await api.get(`/analytics/${userId}/safe-save`);
    return response.data;
  },

  getProjection: async (userId: number) => {
    const response = await api.get(`/analytics/${userId}/projection`);
    return response.data;
  },

  categorizeMerchant: async (merchant: string, description = '') => {
    const response = await api.post('/analytics/categorize-merchant', {
      merchant,
      description,
    });
    return response.data;
  },

  getSpendingInsights: async (userId: number, days = 30) => {
    const response = await api.get(`/analytics/${userId}/spending-insights?days=${days}`);
    return response.data;
  },
};

// Budget API
export const budgetAPI = {
  get: async (userId: number) => {
    const response = await api.get(`/budget/${userId}`);
    return response.data;
  },

  update: async (
    userId: number,
    budgetData: {
      essential_percentage?: number;
      discretionary_percentage?: number;
      savings_percentage?: number;
      emergency_fund_target?: number;
    }
  ) => {
    const response = await api.put(`/budget/${userId}`, budgetData);
    return response.data;
  },

  getAnalysis: async (userId: number, days = 30) => {
    const response = await api.get(`/budget/${userId}/analysis?days=${days}`);
    return response.data;
  },
};

// Education API
export const educationAPI = {
  getTips: async (lang = 'en', category?: string, limit = 10) => {
    const params = new URLSearchParams({ lang, limit: limit.toString() });
    if (category) params.append('category', category);
    
    const response = await api.get(`/education/tips?${params}`);
    return response.data;
  },

  getVideos: async (lang = 'en') => {
    const response = await api.get(`/education/videos?lang=${lang}`);
    return response.data;
  },

  getCategories: async () => {
    const response = await api.get('/education/categories');
    return response.data;
  },

  getQuiz: async (lang = 'en', difficulty = 'easy') => {
    const response = await api.get(`/education/quiz?lang=${lang}&difficulty=${difficulty}`);
    return response.data;
  },

  trackProgress: async (progressData: {
    user_id: number;
    content_type: string;
    content_id: string;
    completion_percentage?: number;
    time_spent?: number;
  }) => {
    const response = await api.post('/education/progress', progressData);
    return response.data;
  },
};

// Health check
export const healthAPI = {
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;