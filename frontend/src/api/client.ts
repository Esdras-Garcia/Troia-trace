import { env } from '../config/env';
import type { Comprovacao, DashboardData, HelpItem, SettingItem } from '../data/dashboard';

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

export type CreateComprovacaoPayload = {
  material: string;
  quantidadeKg: number;
  tipo: string;
  parceiro: string;
  observacoes?: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${env.apiUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }

  return response.json();
}

export function getDashboard(): Promise<DashboardData> {
  return request<DashboardData>('/api/dashboard');
}

export function getComprovacoes(query?: string): Promise<Comprovacao[]> {
  const params = query ? `?query=${encodeURIComponent(query)}` : '';
  return request<Comprovacao[]>(`/api/comprovacoes${params}`);
}

export function getMateriais(): Promise<string[][]> {
  return request<string[][]>('/api/materiais');
}

export function getRelatorios(): Promise<string[][]> {
  return request<string[][]>('/api/relatorios');
}

export function getParceiros(): Promise<string[][]> {
  return request<string[][]>('/api/parceiros');
}

export function getCertificados(): Promise<string[][]> {
  return request<string[][]>('/api/certificados');
}

export function getConfiguracoes(): Promise<SettingItem[]> {
  return request<SettingItem[]>('/api/configuracoes');
}

export function getAjuda(): Promise<HelpItem[]> {
  return request<HelpItem[]>('/api/ajuda');
}

export function createComprovacao(payload: CreateComprovacaoPayload): Promise<Comprovacao> {
  return request<Comprovacao>('/api/comprovacoes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
