import type { TokenManager } from "../../utils/token";
import type { RequestConfig } from "./types";

interface RetryParams extends RequestConfig {
  controller: AbortController;
  attempt: number;
}

export class RequestExecutor {
  constructor(private tokenManager: TokenManager) {}

  async execute<T>(config: RequestConfig): Promise<T> {
    const controller = new AbortController();
    config.requestOptions.signal = controller.signal;

    return this.executeWithRetry<T>({
      ...config,
      controller,
      attempt: 0,
    });
  }

  private async executeWithRetry<T>({
    fullUrl,
    requestOptions,
    timeout,
    retryCount,
    retryDelay,
    handlers,
    controller,
    attempt,
  }: RetryParams): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => {
        controller.abort();
        reject(new Error("Request timed out"));
      }, timeout)
    );

    try {
      if (handlers?.beforeRequest) {
        handlers.beforeRequest(fullUrl, requestOptions);
      }

      const response = (await Promise.race([
        fetch(fullUrl, requestOptions),
        timeoutPromise,
      ])) as Response;

      if (response.status === 401) {
        try {
          await this.tokenManager.handleRefresh();
          return this.executeWithRetry({
            fullUrl,
            requestOptions,
            timeout,
            retryCount,
            retryDelay,
            handlers,
            controller,
            attempt,
          });
        } catch (error) {
          throw new Error("Token refresh failed or unauthorized access.");
        }
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Request failed");
      }

      if (handlers?.afterResponse) {
        handlers.afterResponse(response);
      }

      const contentType = response.headers.get("Content-Type");
      const data = contentType?.includes("application/json")
        ? await response.json()
        : await response.text();

      if (handlers?.onSuccess) {
        handlers.onSuccess(data);
      }

      return data;
    } catch (error) {
      if (handlers?.onError && error instanceof Error) {
        handlers.onError(error);
      }

      if (attempt >= retryCount) {
        throw error;
      }

      await new Promise((res) => setTimeout(res, retryDelay));
      return this.executeWithRetry({
        fullUrl,
        requestOptions,
        timeout,
        retryCount,
        retryDelay,
        handlers,
        controller,
        attempt: attempt + 1,
      });
    }
  }
} 