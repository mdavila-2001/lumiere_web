import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios';

export interface ApiErrorResponse {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

export class ApiError extends Error {
  public statusCode?: number;
  public errors: string[];

  constructor(message: string, errors: string[] = [], statusCode?: number) {
    super(message);
    this.name = 'ApiError';
    this.errors = errors;
    this.statusCode = statusCode;
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    try {
      const token = localStorage.getItem('lumiere_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Failed to load token from localStorage for API request:', error);
    }
    return config;
  },
  (error: unknown): Promise<never> => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    return response;
  },
  (error: unknown): Promise<never> => {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const responseData = error.response?.data as ApiErrorResponse | undefined;

      let message = 'An unexpected error occurred.';
      let errorsList: string[] = [];

      if (responseData) {
        if (Array.isArray(responseData.message)) {
          errorsList = responseData.message;
          message = responseData.message.join(', ');
        } else if (typeof responseData.message === 'string') {
          errorsList = [responseData.message];
          message = responseData.message;
        } else if (responseData.error) {
          errorsList = [responseData.error];
          message = responseData.error;
        }
      } else if (error.message) {
        errorsList = [error.message];
        message = error.message;
      }

      // UX Guard: specific handling for Payload Too Large
      if (statusCode === 413) {
        message = 'The uploaded file exceeds the maximum size allowed.';
        errorsList = [message];
      }

      return Promise.reject(new ApiError(message, errorsList, statusCode));
    }

    return Promise.reject(error);
  }
);

export default api;
