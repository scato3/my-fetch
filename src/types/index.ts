// Next.js specific options
export interface NextFetchOptions {
  revalidate?: number;
  tags?: string[];
}

// API Response structure
export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  config: RequestInit;
}

// Main fetch options
export interface FetchOptions<ResponseType = unknown, RequestType = unknown> {
  method?: string;
  body?: RequestType;
  query?: Record<string, unknown>;
  url: string;
  headers?: Record<string, string>;
  revalidate?: number;
  tags?: string[];
  retryCount?: number;
  retryDelay?: number;
  timeout?: number;
  onSuccess?: (response: ApiResponse<ResponseType>) => void;
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

// Request configuration
export interface RequestConfig {
  fullUrl: string;
  requestOptions: RequestInit & { next?: NextFetchOptions };
  timeout: number;
  retryCount: number;
  retryDelay: number;
  handlers?: RequestHandlers;
}

export interface RequestHandlers {
  beforeRequest?: (url: string, options: RequestInit) => void;
  afterResponse?: (response: Response) => void;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}