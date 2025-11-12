import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TokenManager } from '../utils/token';

describe('TokenManager', () => {
  let tokenManager: TokenManager;

  beforeEach(() => {
    tokenManager = new TokenManager();
  });

  describe('handleRefresh', () => {
    it('should call refresh callback when refreshing is not in progress', async () => {
      const onRefreshToken = vi.fn().mockResolvedValue('new-token');

      await tokenManager.handleRefresh(onRefreshToken);

      expect(onRefreshToken).toHaveBeenCalledTimes(1);
    });

    it('should not call refresh callback multiple times for concurrent requests', async () => {
      const onRefreshToken = vi.fn().mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve('new-token'), 100))
      );

      // Start multiple refresh requests simultaneously
      const promises = [
        tokenManager.handleRefresh(onRefreshToken),
        tokenManager.handleRefresh(onRefreshToken),
        tokenManager.handleRefresh(onRefreshToken),
      ];

      await Promise.all(promises);

      // Callback should only be called once
      expect(onRefreshToken).toHaveBeenCalledTimes(1);
    });

    it('should call onRefreshTokenFailed when refresh fails', async () => {
      const onRefreshToken = vi.fn().mockRejectedValue(new Error('Refresh failed'));
      const onRefreshTokenFailed = vi.fn();

      await expect(
        tokenManager.handleRefresh(onRefreshToken, onRefreshTokenFailed)
      ).rejects.toThrow('Refresh failed');

      expect(onRefreshTokenFailed).toHaveBeenCalledTimes(1);
    });

    it('should allow refresh after previous refresh completes', async () => {
      const onRefreshToken = vi.fn().mockResolvedValue('new-token');

      await tokenManager.handleRefresh(onRefreshToken);
      await tokenManager.handleRefresh(onRefreshToken);

      expect(onRefreshToken).toHaveBeenCalledTimes(2);
    });

    it('should resolve queued requests when refresh succeeds', async () => {
      let resolveRefresh: any;
      const onRefreshToken = vi.fn().mockImplementation(
        () => new Promise(resolve => { resolveRefresh = resolve; })
      );

      const promise1 = tokenManager.handleRefresh(onRefreshToken);
      const promise2 = tokenManager.handleRefresh(onRefreshToken);
      const promise3 = tokenManager.handleRefresh(onRefreshToken);

      // Wait a bit to ensure all promises are queued
      await new Promise(resolve => setTimeout(resolve, 10));

      // Resolve the refresh
      resolveRefresh('new-token');

      // All promises should resolve
      await expect(Promise.all([promise1, promise2, promise3])).resolves.toBeDefined();
      expect(onRefreshToken).toHaveBeenCalledTimes(1);
    });

    it('should reject queued requests when refresh fails', async () => {
      let rejectRefresh: any;
      const onRefreshToken = vi.fn().mockImplementation(
        () => new Promise((_, reject) => { rejectRefresh = reject; })
      );

      const promise1 = tokenManager.handleRefresh(onRefreshToken);
      const promise2 = tokenManager.handleRefresh(onRefreshToken);

      // Wait a bit to ensure all promises are queued
      await new Promise(resolve => setTimeout(resolve, 10));

      // Reject the refresh
      rejectRefresh(new Error('Token refresh failed'));

      // All promises should reject
      await expect(promise1).rejects.toThrow('Token refresh failed');
      await expect(promise2).rejects.toThrow('Token refresh failed');
    });
  });
});
