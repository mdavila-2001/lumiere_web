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

function clearExpiredCredentials(): void {
  try {
    localStorage.removeItem('lumiere_token');
    localStorage.removeItem('lumiere_user');
  } catch (e) {
    console.error('Error al limpiar las credenciales expiradas de localStorage:', e);
  }
}

function extractErrorMessage(
  responseData: ApiErrorResponse | undefined,
  fallbackMessage?: string
): { message: string; errorsList: string[] } {
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
  } else if (fallbackMessage) {
    errorsList = [fallbackMessage];
    message = fallbackMessage;
  }

  return { message, errorsList };
}

api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    return response;
  },
  (error: unknown): Promise<never> => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const statusCode = error.response?.status;
    const responseData = error.response?.data as ApiErrorResponse | undefined;

    let { message, errorsList } = extractErrorMessage(responseData, error.message);

    if (statusCode === 413) {
      message = 'The uploaded file exceeds the maximum size allowed.';
      errorsList = [message];
    }

    if (statusCode === 401) {
      clearExpiredCredentials();
      globalThis.location.href = '/login';
    }

    return Promise.reject(new ApiError(message, errorsList, statusCode));
  }
);

export default api;
