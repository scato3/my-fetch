import type { FetchOptions } from "../../types";
import type { TokenManager } from "../../utils/token";
import { createUrl } from "./url";
import { createRequestOptions } from "./options";
import { RequestExecutor } from "./executor";

export class RequestHandler {
  private executor: RequestExecutor;

  constructor(tokenManager: TokenManager) {
    this.executor = new RequestExecutor(tokenManager);
  }

  async execute<T = unknown>(
    options: FetchOptions<T>,
    config: {
      baseUrl: string;
      getToken?: () => string | null | Promise<string | null>;
      authorizationType?: string | null;
    }
  ): Promise<T> {
    const fullUrl = createUrl(options.url, options.query, config.baseUrl);
    const requestOptions = await createRequestOptions({
      method: options.method || "GET",
      body: options.body,
      headers: options.headers || {},
      useToken: options.useToken ?? true,
      getToken: config.getToken,
      authorizationType: config.authorizationType,
      revalidate: options.revalidate,
      tags: options.tags,
    });

    return this.executor.execute({
      fullUrl,
      requestOptions,
      timeout: options.timeout ?? 5000,
      retryCount: options.retryCount ?? 0,
      retryDelay: options.retryDelay ?? 1000,
      handlers: {
        beforeRequest: options.beforeRequest,
        afterResponse: options.afterResponse,
        onSuccess: options.onSuccess,
        onError: options.onError,
      },
    });
  }
}
