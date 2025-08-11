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
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new ApiError(response.status, error.message || 'Request failed');
  }

  return response.json();
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
      body: JSON.stringify(refreshToken),
    }),

  logout: (refreshToken: string) =>
    apiRequest('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),
};

// Facilities API
export const facilitiesApi = {
  list: (params?: {
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
    amenities?: string[];
    images?: string[];
  }) => apiRequest('/facilities', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Courts API
export const courtsApi = {
  create: (data: {
    name: string;
    facilityId: string;
    pricePerHour: number;
    openTime: number;
    closeTime: number;
  }) => apiRequest('/courts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  getByFacility: (facilityId: string) => apiRequest<Court[]>(`/courts/facility/${facilityId}`),

  getOwnerCourts: () => apiRequest<(Court & {
    facility: {
      name: string;
      location: string;
      status: string;
    };
    _count: {
      bookings: number;
    };
  })[]>('/courts/owner'),

  getById: (id: string) => apiRequest<Court & {
    facility: {
      name: string;
      location: string;
      status: string;
      sports: string[];
      amenities: string[];
    };
  }>(`/courts/${id}`),

  update: (id: string, data: {
    name?: string;
    pricePerHour?: number;
    openTime?: number;
    closeTime?: number;
  }) => apiRequest(`/courts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  delete: (id: string) => apiRequest(`/courts/${id}`, {
    method: 'DELETE',
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
