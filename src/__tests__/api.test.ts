import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import Api from '../index';

describe('Api', () => {
  let api: Api;

  beforeEach(() => {
    api = new Api({
      baseUrl: 'https://api.example.com',
      getToken: () => 'test-token',
      authorizationType: 'Bearer',
    });

    // Mock fetch
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('GET request', () => {
    it('should make GET request with correct URL and headers', async () => {
      const mockResponse = { id: 1, name: 'Test' };

      (vi.mocked(fetch)).mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'application/json' },
        })
      );

      const response = await api.get<typeof mockResponse>({
        url: '/users/1',
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          }),
        })
      );

      expect(response.data).toEqual(mockResponse);
      expect(response.status).toBe(200);
      expect(response.statusText).toBe('OK');
    });

    it('should add query parameters to URL', async () => {
      (vi.mocked(fetch)).mockResolvedValueOnce(
        new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      );

      await api.get({
        url: '/users',
        query: { page: 1, limit: 10 },
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=1'),
        expect.any(Object)
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=10'),
        expect.any(Object)
      );
    });
  });

  describe('POST request', () => {
    it('should make POST request with body', async () => {
      const requestBody = { name: 'New User' };
      const mockResponse = { id: 2, ...requestBody };

      (vi.mocked(fetch)).mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 201,
          statusText: 'Created',
          headers: { 'content-type': 'application/json' },
        })
      );

      const response = await api.post<typeof mockResponse>({
        url: '/users',
        body: requestBody,
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody),
        })
      );

      expect(response.data).toEqual(mockResponse);
      expect(response.status).toBe(201);
    });
  });

  describe('Error handling', () => {
    it('should throw error when response is not ok', async () => {
      (vi.mocked(fetch)).mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Not found' }), {
          status: 404,
          statusText: 'Not Found',
          headers: { 'content-type': 'application/json' },
        })
      );

      await expect(
        api.get({ url: '/users/999' })
      ).rejects.toThrow('Not found');
    });

    it('should handle timeout', async () => {
      (vi.mocked(fetch)).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 10000))
      );

      await expect(
        api.get({ url: '/users', timeout: 100 })
      ).rejects.toThrow('Request timed out');
    });
  });

  describe('Custom headers', () => {
    it('should merge custom headers', async () => {
      (vi.mocked(fetch)).mockResolvedValueOnce(
        new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      );

      await api.get({
        url: '/users',
        headers: { 'X-Custom-Header': 'custom-value' },
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'custom-value',
          }),
        })
      );
    });

    it('should not include Authorization header when useToken is false', async () => {
      (vi.mocked(fetch)).mockResolvedValueOnce(
        new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      );

      await api.get({
        url: '/public',
        useToken: false,
      });

      const callArgs = (vi.mocked(fetch)).mock.calls[0]?.[1];
      expect(callArgs?.headers).not.toHaveProperty('Authorization');
    });
  });

  describe('Callbacks', () => {
    it('should call onSuccess callback', async () => {
      const mockResponse = { id: 1, name: 'Test' };
      const onSuccess = vi.fn();

      (vi.mocked(fetch)).mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'application/json' },
        })
      );

      await api.get({
        url: '/users/1',
        onSuccess,
      });

      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          data: mockResponse,
          status: 200,
        })
      );
    });

    it('should call onError callback', async () => {
      const onError = vi.fn();

      (vi.mocked(fetch)).mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Not found' }), {
          status: 404,
          statusText: 'Not Found',
          headers: { 'content-type': 'application/json' },
        })
      );

      await expect(
        api.get({
          url: '/users/999',
          onError,
        })
      ).rejects.toThrow();

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Not found',
        })
      );
    });
  });
});
