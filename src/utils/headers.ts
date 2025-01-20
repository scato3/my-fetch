export const createHeaders = (
  token: string | null,
  headers: Record<string, string>,
  useToken: boolean,
  authorizationType?: string | null
): HeadersInit => {
  const authorizationHeader: Record<string, string> =
    useToken && token
      ? {
          Authorization: authorizationType
            ? `${authorizationType} ${token}`
            : token,
        }
      : {};

  return {
    "Content-Type": "application/json",
    ...authorizationHeader,
    ...headers,
  };
}; 