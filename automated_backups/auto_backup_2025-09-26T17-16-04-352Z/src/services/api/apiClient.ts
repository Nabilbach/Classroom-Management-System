const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface ApiErrorResponse {
  message: string;
  statusCode?: number;
  details?: any;
}

interface RequestOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
}

const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000; // 1 second

async function fetchWithRetry(url: string, options: RequestOptions = {}): Promise<Response> {
  const { retries = DEFAULT_RETRIES, retryDelay = DEFAULT_RETRY_DELAY, ...fetchOptions } = options;

  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, fetchOptions);
      if (response.ok) {
        return response;
      } else {
        // For non-OK responses, if it's a server error (5xx) and not the last retry, try again
        if (response.status >= 500 && response.status < 600 && i < retries) {
          console.warn(`Request to ${url} failed with status ${response.status}. Retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, i))); // Exponential backoff
          continue;
        } else {
          // For client errors (4xx) or non-retryable server errors, or last retry, throw immediately
          const errorData: ApiErrorResponse = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
      }
    } catch (error: any) {
      // Network errors (e.g., offline, DNS issues) or AbortError
      if (error.name === 'AbortError') {
        throw error; // Do not retry on explicit cancellation
      }
      if (i < retries) {
        console.warn(`Request to ${url} failed: ${error.message}. Retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, i))); // Exponential backoff
      } else {
        throw new Error(`Failed to fetch ${url} after ${retries + 1} attempts: ${error.message}`);
      }
    }
  }
  throw new Error("Should not reach here"); // Fallback, in case loop finishes without returning/throwing
}

const apiClient = {
  get: async <T>(path: string, options?: RequestOptions): Promise<T> => {
    const response = await fetchWithRetry(`${API_BASE_URL}${path}`, { ...options, method: 'GET' });
    return response.json();
  },

  post: async <T>(path: string, body: any, options?: RequestOptions): Promise<T> => {
    const response = await fetchWithRetry(`${API_BASE_URL}${path}`, {
      ...options,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
      body: JSON.stringify(body),
    });
    return response.json();
  },

  put: async <T>(path: string, body: any, options?: RequestOptions): Promise<T> => {
    const response = await fetchWithRetry(`${API_BASE_URL}${path}`, {
      ...options,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
      body: JSON.stringify(body),
    });
    return response.json();
  },

  delete: async <T>(path: string, options?: RequestOptions): Promise<T | void> => { // Return type can be void
    const response = await fetchWithRetry(`${API_BASE_URL}${path}`, { ...options, method: 'DELETE' });
    if (response.status === 204) {
      return; // For No Content, return nothing.
    }
    return response.json(); // For other responses, parse JSON as usual.
  },
};

export default apiClient;
