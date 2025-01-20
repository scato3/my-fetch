import type { NextFetchOptions } from "../../types";

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