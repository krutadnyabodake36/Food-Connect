const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const TOKEN_STORAGE_KEY = 'foodconnect_token';

/**
 * Production-Grade API Request Utility
 * 
 * Features:
 * - Automatic Bearer token injection from localStorage
 * - Comprehensive error handling and logging
 * - JSON parsing with fallback
 * - 401 Unauthorized event dispatch for global logout
 * - Detailed console logging for debugging authentication issues
 */
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const method = options.method || 'GET';
  
  // Debug logging
  console.log(`[API] 🚀 ${method} ${path}`);
  if (token) {
    console.log(`[API] 🔑 Token present (${token.substring(0, 10)}...)`);
  } else {
    console.log(`[API] ⚠️ No token in localStorage`);
  }

  const headers = new Headers(options.headers || {});
  
  // Set Authorization header if token exists and not already set
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Set Content-Type if not already set and body is being sent
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      cache: 'no-store',
    });

    // Parse response body
    const text = await response.text();
    let data: any = null;
    
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.warn(`[API] ⚠️ Non-JSON response from ${path}:`, text.substring(0, 100));
        data = { message: text };
      }
    }

    // Handle errors
    if (!response.ok) {
      console.error(`[API] ❌ ${response.status} ${method} ${path}`, data);
      
      // Special handling for 401 Unauthorized
      if (response.status === 401) {
        console.warn('[API] 🔓 401 Unauthorized - dispatching logout event');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }

      // Extract error message from various response formats
      let errorMessage = `${response.statusText || 'Request failed'}`;
      
      if (data?.detail) {
        if (Array.isArray(data.detail)) {
          errorMessage = data.detail
            .map((d: any) => d.msg || d.message || 'Invalid field')
            .join(', ');
        } else {
          errorMessage = String(data.detail);
        }
      } else if (data?.message) {
        errorMessage = data.message;
      } else if (data?.error) {
        errorMessage = data.error;
      }
      
      throw new Error(errorMessage);
    }

    console.log(`[API] ✅ ${method} ${path} - Success`);
    return data as T;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[API] 🔥 ${method} ${path} - ${error.message}`);
      throw error;
    }
    throw new Error('Network error - please check your connection');
  }
}

export { API_BASE_URL, TOKEN_STORAGE_KEY };

