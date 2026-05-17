import { env } from '../config/env';
import type {
  AppShellData,
  CertificateItem,
  Comprovacao,
  DashboardData,
  HelpItem,
  MaterialItem,
  PartnerItem,
  ReportItem,
  SettingItem,
} from '../data/dashboard';

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

export function getAppShell(): Promise<AppShellData> {
  return request<AppShellData>('/api/app-shell');
}

function queryString(query?: string) {
  return query ? `?query=${encodeURIComponent(query)}` : '';
}

export function getComprovacoes(query?: string): Promise<Comprovacao[]> {
  return request<Comprovacao[]>(`/api/comprovacoes${queryString(query)}`);
}

export function getMateriais(query?: string): Promise<MaterialItem[]> {
  return request<MaterialItem[]>(`/api/materiais${queryString(query)}`);
}

export function getRelatorios(query?: string): Promise<ReportItem[]> {
  return request<ReportItem[]>(`/api/relatorios${queryString(query)}`);
}

export function getParceiros(query?: string): Promise<PartnerItem[]> {
  return request<PartnerItem[]>(`/api/parceiros${queryString(query)}`);
}

export function getCertificados(query?: string): Promise<CertificateItem[]> {
  return request<CertificateItem[]>(`/api/certificados${queryString(query)}`);
}

export function getConfiguracoes(query?: string): Promise<SettingItem[]> {
  return request<SettingItem[]>(`/api/configuracoes${queryString(query)}`);
}

export function getAjuda(query?: string): Promise<HelpItem[]> {
  return request<HelpItem[]>(`/api/ajuda${queryString(query)}`);
}

export function createComprovacao(payload: CreateComprovacaoPayload): Promise<Comprovacao> {
  return request<Comprovacao>('/api/comprovacoes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
