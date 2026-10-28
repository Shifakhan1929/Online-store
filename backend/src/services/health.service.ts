export interface HealthStatus {
  status: string;
  message: string;
  timestamp: string;
}

export const getHealthStatus = (): HealthStatus => {
  return {
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  };
};
