import queryString from "query-string";

export const createUrl = (url: string, query?: Record<string, unknown>, baseUrl?: string): string => {
  const fullUrl = url.startsWith("http")
    ? url
    : `${baseUrl?.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;

  return query
    ? `${fullUrl}?${queryString.stringify(query, { skipNull: true, skipEmptyString: true })}`
    : fullUrl;
}; 