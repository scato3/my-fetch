export class TokenManager {
  private isRefreshing = false;
  private queue: {
    resolve: () => void;
    reject: (reason?: any) => void;
  }[] = [];

  async handleRefresh(
    onRefreshToken?: () => string | null | Promise<string | null>,
    onRefreshTokenFailed?: () => void
  ): Promise<void> {
    if (this.isRefreshing) {
      return new Promise<void>((resolve, reject) => {
        this.queue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      await onRefreshToken?.();
      this.resolveQueue();
    } catch (error) {
      onRefreshTokenFailed?.();
      this.rejectQueue(error);
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  private resolveQueue(): void {
    while (this.queue.length) {
      const { resolve } = this.queue.shift()!;
      resolve();
    }
  }

  private rejectQueue(error: any): void {
    while (this.queue.length) {
      const { reject } = this.queue.shift()!;
      reject(error);
    }
  }
} 