// Resolve API base dynamically with sensible fallbacks to avoid mixed-content/CORS in production
function resolveApiBase(): string {
  const envBase: string | undefined = (import.meta as any).env?.VITE_API_BASE_URL?.trim?.();
  let metaBase: string | undefined;
  try {
    if (typeof document !== 'undefined') {
      const el = document.querySelector('meta[name="quickcourt:api-base"]') as HTMLMetaElement | null;
      metaBase = el?.content?.trim();
    }
  } catch (_) {
    // ignore if document is not available
  }

  let base = (metaBase || envBase || '').trim();

  const isBrowser = typeof window !== 'undefined' && typeof location !== 'undefined';
  const isLocalHost = isBrowser && (/^localhost$/.test(location.hostname) || /^127\.0\.0\.1$/.test(location.hostname));
  const isHttpsPage = isBrowser && location.protocol === 'https:';

  // If we're on a deployed host (not localhost) and base is empty or clearly localhost, prefer same-origin as a safe fallback.
  if (isBrowser && !isLocalHost) {
    const baseLooksLocalhost = base && /(^http:\/\/|^https:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?/i.test(base);
    if (!base || baseLooksLocalhost) {
      console.warn('[QuickCourt] API base not configured or points to localhost on a production host.');
      console.warn('Set VITE_API_BASE_URL to your API URL (e.g. https://api.example.com). Falling back to same-origin.');
      base = '';
    }
  }

  // Avoid mixed content: if page is https and API is http, try protocol upgrade (when not localhost)
  if (base && isHttpsPage && base.startsWith('http://')) {
    try {
      const u = new URL(base);
      if (!/(^localhost$)|(^127\.0\.0\.1$)/.test(u.hostname)) {
        u.protocol = 'https:';
        base = u.toString();
      } else {
        // On https page, calling http://localhost will be blocked. Prefer same-origin.
        base = '';
      }
    } catch {
      // leave base as-is if URL parsing fails
    }
  }

  // Normalize: remove trailing slash
  if (base.endsWith('/')) base = base.slice(0, -1);

  // Final selection
  if (!base) {
    // If running locally, prefer localhost API. If running on a non-local host, use same-origin ('').
    if (isBrowser && isLocalHost) return 'http://localhost:4000';
    return '';
  }
  return base;
}

export const API_BASE_URL = resolveApiBase();

// API utility functions
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface OtpDelivery {
  queued?: boolean;
  disabled?: boolean;
  devOtp?: string;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    // If token is expired, try to refresh it
    if (response.status === 401 && token) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const refreshResponse = await authApi.refresh(refreshToken);
          localStorage.setItem('accessToken', refreshResponse.accessToken);
          localStorage.setItem('refreshToken', refreshResponse.refreshToken);
          
          // Retry the original request with new token
          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${refreshResponse.accessToken}`,
              ...options.headers,
            },
            ...options,
          });
          
          if (retryResponse.ok) {
            return retryResponse.json();
          }
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    
    let errorMessage = 'Request failed';
    try {
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        errorMessage = json.message || json.error || 'Request failed';
      } catch {
        // Handle non-JSON HTML response (e.g. Vercel 404 NOT_FOUND)
        if (response.status === 404) {
          errorMessage = 'API endpoint not found. Please verify backend server configuration.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again in a moment.';
        } else {
          errorMessage = `Server returned status ${response.status}`;
        }
      }
    } catch {
      errorMessage = 'Network connection failed.';
    }
    throw new ApiError(response.status, errorMessage);
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
    inviteSecret?: string;
    referralCode?: string;
  }) => apiRequest<{ userId: string; userRole?: 'USER' | 'OWNER' | 'ADMIN'; accessToken?: string; refreshToken?: string; user?: User; delivery?: OtpDelivery }>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  verifyOtp: (data: { userId: string; otp: string }) =>
    apiRequest('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resendOtp: (data: { email: string }) =>
    apiRequest<{ userId: string; userRole: 'USER' | 'OWNER' | 'ADMIN'; delivery?: OtpDelivery }>('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  sendLoginOtp: (data: { email: string }) =>
    apiRequest<{ userId: string; userRole: 'USER' | 'OWNER' | 'ADMIN'; delivery?: OtpDelivery }>('/auth/send-login-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  verifyLoginOtp: (data: { userId: string; otp: string }) =>
    apiRequest<{ accessToken: string; refreshToken: string; user: User }>('/auth/verify-login-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    apiRequest<{ accessToken: string; refreshToken: string; user: User }>('/auth/login', {
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

  me: () => apiRequest<User>('/auth/me'),

  updateProfile: (data: {
    fullName?: string;
    avatarUrl?: string | null;
    currentPassword?: string;
    newPassword?: string;
  }) => apiRequest<User>('/auth/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// Loyalty & Rewards API
export const loyaltyApi = {
  me: () => apiRequest<{ loyaltyPoints: number; currentStreak: number }>(`/loyalty/me`),
  ledger: () => apiRequest<Array<{ id: string; userId: string; delta: number; balanceAfter: number; source: string; meta: any; createdAt: string }>>(`/loyalty/ledger`),
  ensureReferralCode: () => apiRequest<{ code: string }>(`/loyalty/referral/code`),
  applyReferral: (code: string) => apiRequest<{ success: true }>(`/loyalty/referral/apply`, { method: 'POST', body: JSON.stringify({ code }) })
};

export interface BadgeEarned {
  id: string; code: string; name: string; description: string; earnedAt: string;
}

export const badgeApi = {
  mine: () => apiRequest<BadgeEarned[]>(`/badges/me`),
  list: () => apiRequest<Array<{ id: string; code: string; name: string; description: string }>>(`/badges`)
};

// Facilities API
export const facilitiesApi = {
  list: (params?: {
    sport?: string;
    q?: string;
    propertyType?: "PLAY" | "BOOK" | "TRAIN";
    priceMin?: number;
    priceMax?: number;
    amenities?: string[];
    sort?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.sport) searchParams.set('sport', params.sport);
    if (params?.q) searchParams.set('q', params.q);
    if (params?.propertyType) searchParams.set('propertyType', params.propertyType);
    if (params?.priceMin !== undefined) searchParams.set('priceMin', params.priceMin.toString());
    if (params?.priceMax !== undefined) searchParams.set('priceMax', params.priceMax.toString());
    if (params?.amenities?.length) searchParams.set('amenities', params.amenities.join(','));
    if (params?.sort) searchParams.set('sort', params.sort);
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
    // Optional geo
    latitude?: number;
    longitude?: number;
  propertyTypes?: ("PLAY" | "BOOK" | "TRAIN")[];
  }) => apiRequest('/facilities', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  getAvailability: (facilityId: string, date: string) => apiRequest<{
    id: string;
    startTime: string;
    endTime: string;
    price: number;
    isAvailable: boolean;
    isBooked?: boolean;
    isPast?: boolean;
    isMaintenance?: boolean;
    reason?: 'BOOKED' | 'PAST' | 'MAINTENANCE' | 'AVAILABLE';
    courtId: string;
    courtName: string;
  }[]>(`/facilities/${facilityId}/availability?date=${encodeURIComponent(date)}`),
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

  createMaintenance: (id: string, data: { startTime: string; endTime: string; reason?: string }) =>
    apiRequest(`/courts/${id}/maintenance`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  removeMaintenance: (maintenanceId: string) =>
    apiRequest<{ success: true }>(`/courts/maintenance/${maintenanceId}`, {
      method: 'DELETE',
    }),

  delete: (id: string) => apiRequest(`/courts/${id}`, {
    method: 'DELETE',
  }),
};

// Bookings API
export const bookingsApi = {
  create: (data: { courtId: string; startTime: string; endTime: string; }) =>
    apiRequest<Booking>('/bookings', { method: 'POST', body: JSON.stringify(data) }),

  cancel: (id: string) => apiRequest<Booking>(`/bookings/${id}/cancel`, { method: 'PUT' }),

  delete: (id: string) => apiRequest<{ success: true }>(`/bookings/${id}`, { method: 'DELETE' }),

  getMy: () => apiRequest<Booking[]>('/bookings/my'),

  getOwnerStats: () => apiRequest<{ totalBookings: number; payments: { succeeded: number; refunded: number; net: number } }>(
    '/bookings/owner/stats'
  ),
};

export interface Review {
  id: string;
  userId: string;
  facilityId: string;
  rating: number;
  comment?: string;
  sport?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
}

export const reviewsApi = {
  listForFacility: (facilityId: string, page = 1, pageSize = 10) =>
    apiRequest<{ reviews: Review[]; totalCount: number; page: number; pageSize: number; totalPages: number }>(
      `/reviews/facility/${facilityId}?page=${page}&pageSize=${pageSize}`
    ),
  statsForFacility: (facilityId: string) =>
    apiRequest<{ averageRating: number; totalReviews: number; ratingDistribution: Array<{ rating: number; count: number }> }>(
      `/reviews/facility/${facilityId}/stats`
    ),
  create: (data: { facilityId: string; rating: number; comment?: string; sport?: string }) =>
    apiRequest<Review>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
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
  propertyTypes?: ("PLAY" | "BOOK" | "TRAIN")[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  ownerId: string;
  courts: Court[];
  rating?: number;
  reviewCount?: number;
  minPrice?: number;
  maxPrice?: number;
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
  emailVerifiedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
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
