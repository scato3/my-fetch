# hsc-fetch

**hsc-fetch** is a TypeScript-based HTTP client library offering features like token management, retry logic, and timeout settings. It is designed to integrate seamlessly with frameworks like Next.js 14, supporting modern server and client-side rendering use cases.

**Note**: Comprehensive E2E testing has been conducted using **Cypress** to ensure reliability and stability across various scenarios.

## Key Features

- **Token Management**: Automatically checks for token expiration and refreshes tokens as needed. Handles multiple requests in a queue during token refresh, ensuring only one refresh occurs at a time.
- **Retry Logic**: Retries requests on failure for a specified number of times, with configurable delay intervals. Manages `401 Unauthorized` responses with a limit to prevent infinite loops.
- **Timeout Handling**: Allows setting timeouts for requests, canceling them if the response takes too long.
- **Hooks Support**: Provides hooks for custom logic before and after requests.
- **Next.js Integration**: Options like `revalidate` and `tags` for compatibility with Next.js ISR (Incremental Static Regeneration).

## Installation

```bash
npm install hsc-fetch
```

## Usage Example

```ts
import Api from "hsc-fetch";

// Create an API instance
const api = new Api({
  baseUrl: "https://api.example.com",
  getToken: () => localStorage.getItem("token"),
  onRefreshToken: async () => {
    // Implement token refresh logic
    const response = await fetch("/refresh-token");
    const { token } = await response.json();
    localStorage.setItem("token", token);
  },
  onRefreshTokenFailed: () => {
    // Handle refresh token failure
    localStorage.removeItem("token");
    window.location.href = "/login";
  },
  authorizationType: "Bearer",
});

// Example GET request with error handling
const fetchData = async () => {
  try {
    const response = await api.get({
      url: "/data",
      query: { page: 1 },
      revalidate: 60,
      tags: ["data"],
      onSuccess: (response) => {
        console.log("Data fetched successfully:", response.data);
        console.log("Status:", response.status);
      },
      onError: (error) => {
        console.error("Error fetching data:", error);
      },
    });

    // Access response data (axios-like)
    console.log(response.data);      // Actual data
    console.log(response.status);    // HTTP status code (e.g., 200)
    console.log(response.statusText); // HTTP status text (e.g., "OK")
    console.log(response.headers);   // Response headers
  } catch (error) {
    console.error("Request failed:", error);
  }
};

// Example POST request with timeout
const postData = async () => {
  try {
    const response = await api.post({
      url: "/data",
      body: { name: "John Doe" },
      timeout: 5000,
      retryCount: 3,
      retryDelay: 1000,
      onSuccess: (response) => {
        console.log("Data posted successfully:", response.data);
      },
      onError: (error) => {
        console.error("Error posting data:", error);
      },
    });

    // Access response like axios
    console.log(response.data);
    console.log(response.status);
  } catch (error) {
    console.error("Request failed:", error);
  }
};
```

## API Reference

### `Api` Class

The `Api` class manages HTTP requests, handles token refresh, and implements retry logic.

#### Constructor Options

```ts
interface ApiConfig {
  baseUrl: string;
  getToken?: () => string | null | Promise<string | null>;
  onRefreshToken?: () => Promise<void>;
  onRefreshTokenFailed?: () => void;
  authorizationType?: "Bearer" | "Basic" | string | null;
}
```

### HTTP Methods

All methods return an `ApiResponse<T>` object (axios-like structure):

```ts
get<T>(options: FetchOptions<T>): Promise<ApiResponse<T>>
post<T>(options: FetchOptions<T>): Promise<ApiResponse<T>>
put<T>(options: FetchOptions<T>): Promise<ApiResponse<T>>
patch<T>(options: FetchOptions<T>): Promise<ApiResponse<T>>
delete<T>(options: FetchOptions<T>): Promise<ApiResponse<T>>
```

### Response Structure

```ts
interface ApiResponse<T> {
  data: T;              // Response data
  status: number;       // HTTP status code (e.g., 200, 404)
  statusText: string;   // HTTP status text (e.g., "OK", "Not Found")
  headers: Headers;     // Response headers
  config: RequestInit;  // Request configuration
}
```

### Request Options

The `FetchOptions` interface allows you to customize your requests:

```ts
interface FetchOptions<T = unknown> {
  url: string; // Required: Request URL
  method?: string; // Optional: HTTP method
  body?: T; // Optional: Request body
  query?: Record<string, unknown>; // Optional: Query parameters
  headers?: Record<string, string>; // Optional: Custom headers
  timeout?: number; // Optional: Request timeout (ms)
  retryCount?: number; // Optional: Number of retries
  retryDelay?: number; // Optional: Delay between retries (ms)
  useToken?: boolean; // Optional: Use authentication token
  revalidate?: number; // Optional: Next.js ISR revalidation
  tags?: string[]; // Optional: Next.js ISR tags
  onSuccess?: (response: ApiResponse<T>) => void; // Optional: Success callback
  onError?: (error: Error) => void; // Optional: Error callback
  beforeRequest?: (url: string, options: RequestInit) => void; // Optional: Pre-request hook
  afterResponse?: (response: Response) => void; // Optional: Post-response hook
}
```

## License

MIT © Hyunsu Shin
