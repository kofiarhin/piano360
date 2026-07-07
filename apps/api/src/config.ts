export type ApiConfig = {
  clientOrigin: string;
  nodeEnv: string;
  port: number;
};

const parsePort = (value: string | undefined): number => {
  const fallbackPort = 4000;

  if (!value) {
    return fallbackPort;
  }

  const port = Number.parseInt(value, 10);
  return Number.isInteger(port) && port > 0 ? port : fallbackPort;
};

export const config: ApiConfig = {
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parsePort(process.env.PORT)
};
