import { describe, it, expect } from 'vitest';
import { createUrl } from '../core/request/url';

describe('createUrl', () => {
  it('should create URL with baseUrl and path', () => {
    const result = createUrl('/users', undefined, 'https://api.example.com');
    expect(result).toBe('https://api.example.com/users');
  });

  it('should handle URL without leading slash', () => {
    const result = createUrl('users', undefined, 'https://api.example.com');
    expect(result).toBe('https://api.example.com/users');
  });

  it('should handle baseUrl with trailing slash', () => {
    const result = createUrl('/users', undefined, 'https://api.example.com/');
    expect(result).toBe('https://api.example.com/users');
  });

  it('should add query parameters', () => {
    const result = createUrl('/users', { page: 1, limit: 10 }, 'https://api.example.com');
    expect(result).toContain('https://api.example.com/users?');
    expect(result).toContain('page=1');
    expect(result).toContain('limit=10');
  });

  it('should handle empty query parameters', () => {
    const result = createUrl('/users', {}, 'https://api.example.com');
    // query-string library adds '?' even for empty objects
    expect(result).toMatch(/https:\/\/api\.example\.com\/users\??/);
  });

  it('should handle array query parameters', () => {
    const result = createUrl('/users', { tags: ['a', 'b', 'c'] }, 'https://api.example.com');
    expect(result).toContain('tags=a');
    expect(result).toContain('tags=b');
    expect(result).toContain('tags=c');
  });

  it('should handle special characters in query parameters', () => {
    const result = createUrl('/search', { q: 'hello world' }, 'https://api.example.com');
    // query-string library uses %20 for spaces, not +
    expect(result).toContain('q=hello%20world');
  });

  it('should use absolute URL when provided', () => {
    const result = createUrl('https://other-api.com/data', undefined, 'https://api.example.com');
    expect(result).toBe('https://other-api.com/data');
  });
});
