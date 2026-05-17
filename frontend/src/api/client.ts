import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

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
  const url = apiUrl('/api/health');

  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'erro de rede';
    throw new Error(`Falha ao conectar na API em ${url}: ${detail}`);
  }

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
  evidenciaNome?: string;
  evidenciaTipo?: string;
  evidenciaConteudo?: string;
};

export type UpdateComprovacaoPayload = CreateComprovacaoPayload;

export type PartnerPayload = {
  parceiro: string;
  atuacao: string;
  status: string;
  sla: string;
};

export type CertificatePayload = {
  id: string;
  material: string;
  status: string;
  data: string;
};

export type MobileMe = {
  user: {
    name: string;
    role: string;
  };
  company: CompanyProfile;
  permissions: string[];
};

export type MobileBootstrap = {
  me: MobileMe;
  tasks: Comprovacao[];
  materiais: MaterialItem[];
  parceiros: PartnerItem[];
  certificados: CertificateItem[];
};

export type ComprovacaoAction =
  | 'INICIAR_CONFERENCIA'
  | 'CONFERIR'
  | 'REGISTRAR_DIVERGENCIA'
  | 'APROVAR_DIVERGENCIA'
  | 'REJEITAR'
  | 'LIBERAR_DESTINACAO'
  | 'REGISTRAR_DESTINO'
  | 'SOLICITAR_CERTIFICADO'
  | 'CERTIFICAR'
  | 'GERAR_RELATORIO'
  | 'CANCELAR';

export type ComprovacaoActionPayload = {
  responsavel?: string;
  destino?: string;
  documento?: string;
  observacoes?: string;
  evidenciaNome?: string;
  evidenciaTipo?: string;
  evidenciaConteudo?: string;
};

let authToken: string | null = null;
const authTokenKey = 'troia.authToken';

function apiUrl(path: string) {
  return `${env.apiUrl}${path}`;
}

export function setAuthToken(token: string | null) {
  authToken = token;
}

export async function persistAuthToken(token: string) {
  setAuthToken(token);
  if (Platform.OS === 'web') {
    localStorage.setItem(authTokenKey, token);
    return;
  }
  await SecureStore.setItemAsync(authTokenKey, token);
}

export async function loadStoredAuthToken() {
  const token = Platform.OS === 'web'
    ? localStorage.getItem(authTokenKey)
    : await SecureStore.getItemAsync(authTokenKey);
  setAuthToken(token);
  return token;
}

export async function clearStoredAuthToken() {
  setAuthToken(null);
  if (Platform.OS === 'web') {
    localStorage.removeItem(authTokenKey);
    return;
  }
  await SecureStore.deleteItemAsync(authTokenKey);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = apiUrl(path);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(init?.headers ?? {}),
      },
      ...init,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'erro de rede';
    throw new Error(`Falha ao conectar na API em ${url}: ${detail}`);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`API retornou ${response.status} em ${path}${detail ? `: ${detail.slice(0, 180)}` : ''}`);
  }

  return response.json();
}

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  document: string;
  email: string;
  phone: string;
  address: string;
  plan: string;
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

export function getMobileBootstrap(): Promise<MobileBootstrap> {
  return request<MobileBootstrap>('/api/mobile/sync/bootstrap');
}

export function getMobileTasks(query?: string): Promise<Comprovacao[]> {
  return request<Comprovacao[]>(`/api/mobile/tasks${queryString(query)}`);
}

export function scanMobileQrCode(code: string): Promise<Comprovacao> {
  return request<Comprovacao>(`/api/mobile/qrcodes/${encodeURIComponent(code)}/scan`, {
    method: 'POST',
  });
}

export function updateMobileComprovacaoStatus(id: string, action: ComprovacaoAction, payload: ComprovacaoActionPayload = {}): Promise<Comprovacao> {
  return request<Comprovacao>(`/api/mobile/comprovacoes/${encodeURIComponent(id)}/status`, {
    method: 'POST',
    body: JSON.stringify({ action, ...payload }),
  });
}

export function attachMobileEvidence(id: string, payload: Pick<ComprovacaoActionPayload, 'evidenciaNome' | 'evidenciaTipo' | 'evidenciaConteudo' | 'observacoes'>): Promise<Comprovacao> {
  return request<Comprovacao>(`/api/mobile/comprovacoes/${encodeURIComponent(id)}/evidencias`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function createMobileCertificate(comprovacaoId: string, payload: CertificatePayload): Promise<CertificateItem> {
  return request<CertificateItem>(`/api/mobile/comprovacoes/${encodeURIComponent(comprovacaoId)}/certificados`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
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

export function createParceiro(payload: PartnerPayload): Promise<PartnerItem> {
  return request<PartnerItem>('/api/parceiros', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateParceiro(parceiro: string, payload: PartnerPayload): Promise<PartnerItem> {
  return request<PartnerItem>(`/api/parceiros/${encodeURIComponent(parceiro)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteParceiro(parceiro: string): Promise<PartnerItem> {
  return request<PartnerItem>(`/api/parceiros/${encodeURIComponent(parceiro)}`, {
    method: 'DELETE',
  });
}

export function getCertificados(query?: string): Promise<CertificateItem[]> {
  return request<CertificateItem[]>(`/api/certificados${queryString(query)}`);
}

export function createCertificado(payload: CertificatePayload): Promise<CertificateItem> {
  return request<CertificateItem>('/api/certificados', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateCertificado(id: string, payload: CertificatePayload): Promise<CertificateItem> {
  return request<CertificateItem>(`/api/certificados/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteCertificado(id: string): Promise<CertificateItem> {
  return request<CertificateItem>(`/api/certificados/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export function getConfiguracoes(query?: string): Promise<SettingItem[]> {
  return request<SettingItem[]>(`/api/configuracoes${queryString(query)}`);
}

export type GenerateReportPayload = {
  tipo: string;
  formato: 'PDF' | 'CSV' | 'XLSX';
  periodoInicio: string;
  periodoFim: string;
  materiais: string[];
};

export async function generateReport(payload: GenerateReportPayload): Promise<ReportItem> {
  return request<ReportItem>('/api/relatorios', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function downloadReport(fileName: string) {
  const path = `/api/relatorios/${encodeURIComponent(fileName)}/download`;
  const url = apiUrl(path);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'erro de rede';
    throw new Error(`Falha ao conectar na API em ${url}: ${detail}`);
  }

  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status}`);
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(blobUrl);
  document.body.removeChild(a);
}

export type CreateMaterialPayload = {
  material: string;
  volume: string;
  taxa: string;
  situacao: string;
};

export type UpdateMaterialPayload = CreateMaterialPayload;

export function createMaterial(payload: CreateMaterialPayload): Promise<MaterialItem> {
  return request<MaterialItem>('/api/materiais', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateMaterial(id: string, payload: UpdateMaterialPayload): Promise<MaterialItem> {
  return request<MaterialItem>(`/api/materiais/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteMaterial(id: string): Promise<void> {
  return request<void>(`/api/materiais/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
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

export function updateComprovacao(id: string, payload: UpdateComprovacaoPayload): Promise<Comprovacao> {
  return request<Comprovacao>(`/api/comprovacoes/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function updateComprovacaoStatus(id: string, action: ComprovacaoAction, payload: ComprovacaoActionPayload = {}): Promise<Comprovacao> {
  return request<Comprovacao>(`/api/comprovacoes/${encodeURIComponent(id)}/status`, {
    method: 'POST',
    body: JSON.stringify({ action, ...payload }),
  });
}
