export interface ApiFieldError {
  field?: string;
  message: string;
}

export interface ApiErrorResponse {
  status?: string;
  message?: string;
  errors?: ApiFieldError[];
}

export class ApiError extends Error {
  public statusCode: number;
  public errors?: ApiFieldError[];
  public responseData?: unknown;

  constructor(
    message: string,
    statusCode: number,
    errors?: ApiFieldError[],
    responseData?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.responseData = responseData;
  }
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions extends Omit<RequestInit, 'body' | 'method'> {
  body?: unknown;
  token?: string | null;
  params?: Record<string, string | number | boolean | undefined | null>;
}

// Configurable base URL, defaulting to '/api'
const DEFAULT_BASE_URL = '/api';

export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return DEFAULT_BASE_URL;
};

// Optional global token provider for session management
let tokenProvider: (() => string | null) | null = null;

export const setTokenProvider = (provider: () => string | null): void => {
  tokenProvider = provider;
};

export async function apiRequest<T = unknown>(
  endpoint: string,
  method: HttpMethod = 'GET',
  options: RequestOptions = {}
): Promise<T> {
  const { body, token, params, headers: customHeaders, ...fetchOptions } = options;

  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let url = `${baseUrl}${cleanEndpoint}`;

  // Append query parameters if provided
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  // Add Authorization header if a token is available and not explicitly suppressed
  const resolvedToken = token !== undefined ? token : tokenProvider ? tokenProvider() : null;
  if (resolvedToken && resolvedToken.trim() !== '') {
    headers['Authorization'] = `Bearer ${resolvedToken.trim()}`;
  }

  // Handle request body
  let serializedBody: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (
      typeof body === 'string' ||
      body instanceof FormData ||
      body instanceof Blob ||
      body instanceof URLSearchParams
    ) {
      serializedBody = body;
    } else {
      headers['Content-Type'] = 'application/json';
      serializedBody = JSON.stringify(body);
    }
  }

  // Merge custom headers
  if (customHeaders) {
    if (customHeaders instanceof Headers) {
      customHeaders.forEach((val, key) => {
        headers[key] = val;
      });
    } else if (Array.isArray(customHeaders)) {
      for (const [key, val] of customHeaders) {
        headers[key] = val;
      }
    } else {
      Object.assign(headers, customHeaders);
    }
  }

  const response = await fetch(url, {
    method,
    headers,
    body: serializedBody,
    ...fetchOptions,
  });

  // Handle empty responses safely (e.g. 204 No Content or content-length: 0)
  const contentLength = response.headers.get('content-length');
  const isNoContent = response.status === 204 || contentLength === '0';

  if (isNoContent) {
    if (!response.ok) {
      throw new ApiError(`HTTP Error ${response.status}`, response.status);
    }
    return {} as T;
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  let responseData: any = null;
  const rawText = await response.text();

  if (rawText && rawText.trim() !== '') {
    if (isJson) {
      try {
        responseData = JSON.parse(rawText);
      } catch {
        responseData = rawText;
      }
    } else {
      responseData = rawText;
    }
  }

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}`;
    let fieldErrors: ApiFieldError[] | undefined;

    if (responseData && typeof responseData === 'object') {
      const errObj = responseData as ApiErrorResponse;
      if (errObj.message && typeof errObj.message === 'string') {
        errorMessage = errObj.message;
      }
      if (Array.isArray(errObj.errors)) {
        fieldErrors = errObj.errors;
      }
    }

    throw new ApiError(errorMessage, response.status, fieldErrors, responseData);
  }

  return responseData as T;
}

export const apiClient = {
  get: <T = unknown>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, 'GET', options),

  post: <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, 'POST', { ...options, body }),

  put: <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, 'PUT', { ...options, body }),

  patch: <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, 'PATCH', { ...options, body }),

  delete: <T = unknown>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, 'DELETE', options),
};

export default apiClient;

