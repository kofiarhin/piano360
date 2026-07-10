export type ApiHealth = {
  service: string;
  status: string;
  timestamp: string;
};

export type Lesson = {
  id: string;
  title: string;
  description?: string;
  notes: string[];
  order: number;
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

const parseJsonResponse = async <T>(response: Response, label: string): Promise<T> => {
  if (!response.ok) {
    throw new Error(`${label} request failed with ${response.status}`);
  }

  return (await response.json()) as T;
};

export const fetchLessons = async (): Promise<Lesson[]> => {
  const response = await fetch(`${getApiBaseUrl()}/lessons`);

  return parseJsonResponse<Lesson[]>(response, "Lessons");
};

export const fetchLesson = async (id: string): Promise<Lesson> => {
  const response = await fetch(`${getApiBaseUrl()}/lessons/${encodeURIComponent(id)}`);

  return parseJsonResponse<Lesson>(response, "Lesson detail");
};
