import type { NextFetchOptions } from "../../types";
import { createHeaders } from "../../utils/headers";

interface RequestOptionsParams {
  method: string;
  body?: unknown;
  headers: Record<string, string>;
  useToken: boolean;
  getToken?: () => string | null | Promise<string | null>;
  authorizationType?: string | null;
  revalidate?: number;
  tags?: string[];
}

const createNextOptions = (revalidate?: number, tags?: string[]) => {
  if (!revalidate && !tags) return {};
  
  const next: NextFetchOptions = {};
  if (revalidate !== undefined) next.revalidate = revalidate;
  if (tags) next.tags = tags;
  
  return { next };
};

export const createRequestOptions = async ({
  method,
  body,
  headers,
  useToken,
  getToken,
  authorizationType,
  revalidate,
  tags,
}: RequestOptionsParams): Promise<RequestInit & { next?: NextFetchOptions }> => {
  const token = useToken && getToken ? await getToken() : null;
  const requestHeaders = createHeaders(token, headers, useToken, authorizationType);

  return {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
    ...createNextOptions(revalidate, tags),
  };
}; 