import { env } from '../config/env';
import type {
  AppShellData,
  CertificateItem,
  Comprovacao,
  CompanyProfile,
  DashboardData,
  HelpItem,
  LogoutResponse,
  MaterialItem,
  NotificationItem,
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

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${env.apiUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }

  return response.json();
}

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export function login(payload: LoginPayload): Promise<LoginResponse> {
  return request<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function register(payload: RegisterPayload): Promise<LoginResponse> {
  return request<LoginResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getDashboard(): Promise<DashboardData> {
  return request<DashboardData>('/api/dashboard');
}

export function getAppShell(): Promise<AppShellData> {
  return request<AppShellData>('/api/app-shell');
}

export function getCompanyProfile(): Promise<CompanyProfile> {
  return request<CompanyProfile>('/api/profile/company');
}

export function getNotifications(): Promise<NotificationItem[]> {
  return request<NotificationItem[]>('/api/notifications');
}

export function markNotificationRead(id: string): Promise<NotificationItem> {
  return request<NotificationItem>(`/api/notifications/${encodeURIComponent(id)}/read`, {
    method: 'POST',
  });
}

export function logout(): Promise<LogoutResponse> {
  return request<LogoutResponse>('/api/auth/logout', {
    method: 'POST',
  });
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
