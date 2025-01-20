// Next.js specific options
export interface NextFetchOptions {
  revalidate?: number;
  tags?: string[];
}

// Main fetch options
export interface FetchOptions<T = unknown> {
  method?: string;
  body?: T;
  query?: Record<string, unknown>;
  url: string;
  headers?: Record<string, string>;
  revalidate?: number;
  tags?: string[];
  retryCount?: number;
  retryDelay?: number;
  timeout?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  beforeRequest?: (url: string, options: RequestInit) => void;
  afterResponse?: (response: Response) => void;
  useToken?: boolean;
}

// API configuration
export interface ApiConfig {
  baseUrl: string;
  getToken?: () => string | null | Promise<string | null>;
  onRefreshToken?: () => Promise<void>;
  onRefreshTokenFailed?: () => void;
  authorizationType?: "Bearer" | "Basic" | string | null;
} 