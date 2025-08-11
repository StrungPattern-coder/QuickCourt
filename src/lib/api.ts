const API_BASE_URL = 'http://localhost:4000';

// API utility functions
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  let token = localStorage.getItem('accessToken');
  
  console.log('🌐 API Request:', endpoint);
  console.log('🔑 Token present:', !!token);
  
  // Helper function to make the actual request
  const makeRequest = async (authToken: string | null) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      ...options.headers,
    };
    
    console.log('📋 Request headers:', headers);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers,
      ...options,
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);
    
    return response;
  };

  // Try the initial request
  let response = await makeRequest(token);

  // If token expired (401), try to refresh it
  if (response.status === 401 && token) {
    console.log('🔄 Token expired, attempting refresh...');
    
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        // Try to refresh the token
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const { accessToken: newAccessToken } = await refreshResponse.json();
          localStorage.setItem('accessToken', newAccessToken);
          token = newAccessToken;
          
          console.log('✅ Token refreshed successfully');
          
          // Retry the original request with the new token
          response = await makeRequest(token);
        } else {
          console.log('❌ Token refresh failed, clearing auth data');
          // Refresh failed, clear all auth data
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userData');
          // Redirect to login or show login modal
          window.location.href = '/login';
          return Promise.reject(new ApiError(401, 'Session expired. Please log in again.'));
        }
      } catch (refreshError) {
        console.log('❌ Token refresh error:', refreshError);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData');
        window.location.href = '/login';
        return Promise.reject(new ApiError(401, 'Session expired. Please log in again.'));
      }
    } else {
      console.log('❌ No refresh token available');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userData');
      window.location.href = '/login';
      return Promise.reject(new ApiError(401, 'Session expired. Please log in again.'));
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    console.log('❌ API Error:', error);
    throw new ApiError(response.status, error.message || 'Request failed');
  }

  const result = await response.json();
  console.log('✅ API Success:', result);
  return result;
}

// Auth API
export const authApi = {
  signup: (data: {
    email: string;
    password: string;
    fullName: string;
    role: 'USER' | 'OWNER' | 'ADMIN';
    avatarUrl?: string;
  }) => apiRequest('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  verifyOtp: (data: { userId: string; otp: string }) =>
    apiRequest('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    apiRequest<{ accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  refresh: (refreshToken: string) =>
    apiRequest<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  logout: (refreshToken: string) =>
    apiRequest('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),
};

// Facilities API
export const facilitiesApi = {
  getAll: (params?: {
    sport?: string;
    q?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.sport) searchParams.set('sport', params.sport);
    if (params?.q) searchParams.set('q', params.q);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    
    return apiRequest<{
      items: Facility[];
      total: number;
      page: number;
      pageSize: number;
    }>(`/facilities?${searchParams}`);
  },

  getById: (id: string) => apiRequest<Facility>(`/facilities/${id}`),

  create: (data: {
    name: string;
    location: string;
    description: string;
    sports: string[];
    amenities: string[];
    images: string[];
  }) =>
    apiRequest('/facilities', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Bookings API
export const bookingsApi = {
  create: (data: {
    courtId: string;
    startTime: string;
    endTime: string;
  }) =>
    apiRequest('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMy: () =>
    apiRequest<Booking[]>('/bookings/my'),
};

// Admin API
export const adminApi = {
  getStats: () =>
    apiRequest<{
      totalUsers: number;
      totalFacilities: number;
      totalBookings: number;
      pendingFacilities: number;
      activeBookings: number;
      totalRevenue: number;
      usersLastMonth: number;
      revenueLastMonth: number;
    }>('/admin/stats'),

  getFacilities: (params?: {
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    
    return apiRequest<{
      items: Facility[];
      total: number;
      page: number;
      limit: number;
    }>(`/admin/facilities?${searchParams}`);
  },

  approveFacility: (id: string) =>
    apiRequest(`/admin/facilities/${id}/approve`, {
      method: 'PUT',
    }),

  rejectFacility: (id: string, reason: string) =>
    apiRequest(`/admin/facilities/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),

  // ================= NOTIFICATION ENDPOINTS =================
  
  getNotifications: (params?: {
    unreadOnly?: boolean;
    limit?: number;
    priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.unreadOnly) searchParams.set('unreadOnly', 'true');
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.priority) searchParams.set('priority', params.priority);
    
    return apiRequest<{
      notifications: AdminNotification[];
      unreadCount: number;
      total: number;
    }>(`/admin/notifications?${searchParams}`);
  },

  markNotificationAsRead: (id: string) =>
    apiRequest(`/admin/notifications/${id}/read`, {
      method: 'PUT',
    }),

  markAllNotificationsAsRead: () =>
    apiRequest('/admin/notifications/read-all', {
      method: 'PUT',
    }),

  getUnreadNotificationCount: () =>
    apiRequest<{ unreadCount: number }>('/admin/notifications/unread-count'),
};

// Types
export interface Facility {
  id: string;
  name: string;
  location: string;
  description: string;
  sports: string[];
  amenities: string[];
  images: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  ownerId: string;
  courts: Court[];
  owner?: {
    id: string;
    fullName: string;
    email?: string;
  };
  priceRange?: {
    min: number;
    max: number;
  };
  _count?: {
    courts: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Court {
  id: string;
  name: string;
  facilityId: string;
  pricePerHour: number;
  openTime: number;
  closeTime: number;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  userId: string;
  courtId: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  price: number;
  createdAt: string;
  updatedAt: string;
  court: Court & { facility: Facility };
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: 'USER' | 'OWNER' | 'ADMIN';
  status: 'ACTIVE' | 'BANNED';
}

export interface AdminNotification {
  id: string;
  userId: string;
  type: 'BOOKING_CREATED' | 'BOOKING_CANCELLED' | 'BOOKING_CONFIRMED' | 'FACILITY_APPROVED' | 'FACILITY_REJECTED' | 'ADMIN_ALERT' | 'SYSTEM_UPDATE';
  title: string;
  message: string;
  status: 'UNREAD' | 'READ';
  metadata: {
    facilityId?: string;
    facilityName?: string;
    ownerName?: string;
    ownerEmail?: string;
    ownerId?: string;
    location?: string;
    sports?: string[];
    amenities?: string[];
    action?: string;
    priority?: 'HIGH' | 'MEDIUM' | 'LOW';
    notificationType?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt?: string;
  readAt?: string;
}

// API instance with common HTTP methods
export const api = {
  get: async <T>(endpoint: string): Promise<{ data: T }> => {
    const response = await apiRequest<T>(endpoint, { method: 'GET' });
    return { data: response };
  },
  
  post: async <T>(endpoint: string, data?: any): Promise<{ data: T }> => {
    const response = await apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    return { data: response };
  },
  
  put: async <T>(endpoint: string, data?: any): Promise<{ data: T }> => {
    const response = await apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    return { data: response };
  },
  
  delete: async <T>(endpoint: string): Promise<{ data: T }> => {
    const response = await apiRequest<T>(endpoint, { method: 'DELETE' });
    return { data: response };
  },
};
