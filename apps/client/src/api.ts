export type ApiHealth = {
  service: string;
  status: string;
  timestamp: string;
};

const trimTrailingSlash = (value: string): string => value.replace(/\/$/, "");

export const getApiBaseUrl = (): string => {
  const configuredUrl = import.meta.env.VITE_API_URL as string | undefined;
  return configuredUrl ? trimTrailingSlash(configuredUrl) : "/api";
};

export const fetchHealth = async (): Promise<ApiHealth> => {
  const response = await fetch(`${getApiBaseUrl()}/health`);

  if (!response.ok) {
    throw new Error(`API health request failed with ${response.status}`);
  }

  return (await response.json()) as ApiHealth;
};
