// src/api/axios.ts
// Axios instance with interceptors for auth and error handling

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

class ApiService {
  private instance: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
      timeout: 10000,
    });

    // Request interceptor for auth
    this.instance.interceptors.request.use(
      (config) => {
        // Use InternalAxiosRequestConfig for type safety
        if (this.authToken) {
          config.headers = config.headers || {};
          config.headers['Authorization'] = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.instance.interceptors.response.use(
      (response) => response,
      (error) => {
        // Optionally handle global errors here
        return Promise.reject(error);
      }
    );
  }

  /**
   * Sets or clears the JWT token for all requests (adds/removes Authorization header).
   * @param token JWT token string or null to clear
   * @returns void
   */
  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  /**
   * Generic HTTP GET request with auth and error interceptors.
   * @param endpoint API endpoint (string)
   * @param params Optional query parameters (object)
   * @returns Promise resolving to AxiosResponse<T>
   */
  get<T = any>(endpoint: string, params?: object): Promise<AxiosResponse<T>> {
    return this.instance.get(endpoint, { params });
  }

  /**
   * Generic HTTP POST request with auth and error interceptors.
   * @param endpoint API endpoint (string)
   * @param data Optional request body (object)
   * @returns Promise resolving to AxiosResponse<T>
   */
  post<T = any>(endpoint: string, data?: object): Promise<AxiosResponse<T>> {
    return this.instance.post(endpoint, data);
  }

  /**
   * Generic HTTP PUT request with auth and error interceptors.
   * @param endpoint API endpoint (string)
   * @param data Optional request body (object)
   * @returns Promise resolving to AxiosResponse<T>
   */
  put<T = any>(endpoint: string, data?: object): Promise<AxiosResponse<T>> {
    return this.instance.put(endpoint, data);
  }

  /**
   * Generic HTTP DELETE request with auth and error interceptors.
   * @param endpoint API endpoint (string)
   * @returns Promise resolving to AxiosResponse<T>
   */
  del<T = any>(endpoint: string): Promise<AxiosResponse<T>> {
    return this.instance.delete(endpoint);
  }
}


const apiService = new ApiService();

// Sync transactions for a user
export async function syncTransactions(userId: string, days: number = 30) {
  return apiService.post('/user-challenges/sync-transactions', { userId, days });
}

// Get user transactions
export async function getUserTransactions(userId: string) {
  return apiService.get(`/transactions/${userId}`);
}

// Get all available challenges
export async function getAvailableChallenges() {
  return apiService.get('/challenges');
}

// Join a challenge
export async function joinChallenge(userId: string, challengeId: string) {
  return apiService.post('/user-challenges/join', { userId, challengeId });
}

// Get user's joined challenges (we'll need to create this endpoint)
export async function getUserChallenges(userId: string) {
  return apiService.get(`/user-challenges/${userId}`);
}

// Get streak for a specific challenge
export async function getChallengeStreak(userId: string, challengeId: string) {
  return apiService.get(`/user-challenges/${userId}/${challengeId}/streak`);
}

// Check in to a challenge
export async function checkInChallenge(userId: string, challengeId: string) {
  return apiService.post('/user-challenges/check-in', { userId, challengeId });
}

export default apiService;
