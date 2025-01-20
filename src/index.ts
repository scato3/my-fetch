/* hsc-fetch ver 1.2.5 */

import "core-js/stable";
import "regenerator-runtime/runtime";
import "whatwg-fetch";

import type { ApiConfig, FetchOptions } from "./types";
import { TokenManager } from "./utils/token";
import { RequestHandler } from "./core/request";

// API class for handling requests and token management
class Api {
  private config: ApiConfig;
  private tokenManager: TokenManager;
  private requestHandler: RequestHandler;

  constructor(config: Partial<ApiConfig>) {
    this.config = {
      baseUrl: "",
      getToken: () => null,
      onRefreshToken: async () => {},
      onRefreshTokenFailed: () => {},
      authorizationType: "Bearer",
      ...config,
    };
    this.tokenManager = new TokenManager();
    this.requestHandler = new RequestHandler(this.tokenManager);
  }

  private createRequestMethod(method: string) {
    return <T = unknown>(options: FetchOptions<T>) =>
      this.requestHandler.execute<T>({ method, ...options }, this.config);
  }

  get = this.createRequestMethod("GET");
  post = this.createRequestMethod("POST");
  put = this.createRequestMethod("PUT");
  patch = this.createRequestMethod("PATCH");
  delete = this.createRequestMethod("DELETE");

  // Method to retrieve current configuration
  getConfig() {
    return this.config;
  }

  // Method to update configuration
  updateConfig(config: Partial<ApiConfig>) {
    this.config = { ...this.config, ...config };
  }
}

export default Api;
