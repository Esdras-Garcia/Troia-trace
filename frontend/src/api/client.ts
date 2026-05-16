import { env } from '../config/env';

export type ApiHealth = {
  status: string;
  service: string;
  timestamp: string;
};

export async function getApiHealth(): Promise<ApiHealth> {
  const response = await fetch(`${env.apiUrl}/api/health`);

  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }

  return response.json();
}
