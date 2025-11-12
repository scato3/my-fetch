import { describe, it, expect } from 'vitest';
import { createHeaders } from '../utils/headers';

describe('createHeaders', () => {
  it('should create headers with default Content-Type', () => {
    const result = createHeaders(null, {}, false);

    expect(result).toEqual({
      'Content-Type': 'application/json',
    });
  });

  it('should add Authorization header when token is provided and useToken is true', () => {
    const result = createHeaders('test-token', {}, true, 'Bearer');

    expect(result).toEqual({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token',
    });
  });

  it('should not add Authorization header when useToken is false', () => {
    const result = createHeaders('test-token', {}, false, 'Bearer');

    expect(result).toEqual({
      'Content-Type': 'application/json',
    });
  });

  it('should merge custom headers', () => {
    const customHeaders = { 'X-Custom-Header': 'custom-value' };
    const result = createHeaders(null, customHeaders, false);

    expect(result).toEqual({
      'Content-Type': 'application/json',
      'X-Custom-Header': 'custom-value',
    });
  });

  it('should override Content-Type with custom headers', () => {
    const customHeaders = { 'Content-Type': 'text/plain' };
    const result = createHeaders(null, customHeaders, false);

    expect(result).toEqual({
      'Content-Type': 'text/plain',
    });
  });

  it('should use token without authorization type when authorizationType is null', () => {
    const result = createHeaders('test-token', {}, true, null);

    expect(result).toEqual({
      'Content-Type': 'application/json',
      'Authorization': 'test-token',
    });
  });

  it('should use Basic authorization type', () => {
    const result = createHeaders('test-token', {}, true, 'Basic');

    expect(result).toEqual({
      'Content-Type': 'application/json',
      'Authorization': 'Basic test-token',
    });
  });
});
