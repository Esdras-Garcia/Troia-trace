import type { LucideIcon } from 'lucide-react-native';
import {
  BarChart3,
  Building2,
  FileCheck,
  HelpCircle,
  LayoutDashboard,
  Package,
  Settings,
  Shield,
} from 'lucide-react-native';

export type PageKey =
  | 'overview'
  | 'comprovacoes'
  | 'materiais'
  | 'relatorios'
  | 'parceiros'
  | 'certificados'
  | 'configuracoes'
  | 'ajuda';

export type NavItem = {
  key: PageKey;
  title: string;
  icon: LucideIcon;
};

export type ComprovacaoStatus = 'verificado' | 'pendente' | 'expirado';

export type Comprovacao = {
  id: string;
  hashLastro: string;
  material: string;
  quantidade: string;
  parceiro: string;
  dataEmissao: string;
  status: ComprovacaoStatus;
  tipo: string;
  observacoes?: string | null;
};

export type Stat = {
  title: string;
  value: string;
  unit: string;
  change: string;
  trend: string;
  description: string;
  tone: string;
};
export type VolumeItem = {
  mes: string;
  plastico: number;
  papel: number;
  vidro: number;
  metal: number;
};
export type MaterialDistributionItem = {
  name: string;
  value: number;
  color: string;
};
export type ImpactMetric = {
  title: string;
  value: number;
  target: number;
  unit: string;
};
export type SettingItem = {
  title: string;
  description: string;
  progress: number;
};
export type HelpItem = {
  title: string;
  description: string;
  action: PageKey;
};
export type MaterialItem = {
  material: string;
  volume: string;
  taxa: string;
  situacao: string;
};
export type PartnerItem = {
  parceiro: string;
  atuacao: string;
  status: string;
  sla: string;
};
export type CertificateItem = {
  id: string;
  material: string;
  status: string;
  data: string;
};
export type ReportItem = {
  relatorio: string;
  formato: string;
  status: string;
};
export type DashboardData = {
  shell: AppShellData;
  stats: Stat[];
  comprovacoes: Comprovacao[];
  volumeData: VolumeItem[];
  materialDistribution: MaterialDistributionItem[];
  impactMetrics: ImpactMetric[];
  activities: string[];
  materiais: MaterialItem[];
  parceiros: PartnerItem[];
  certificados: CertificateItem[];
  relatorios: ReportItem[];
  configuracoes: SettingItem[];
  ajuda: HelpItem[];
};

export type PageMetadata = {
  key: PageKey;
  title: string;
  subtitle: string;
  section: 'menu' | 'system';
};
export type AppShellData = {
  brandName: string;
  brandSubtitle: string;
  period: string;
  user: {
    name: string;
    role: string;
  };
  notificationsCount: number;
  pages: PageMetadata[];
};

export const navItems: NavItem[] = [
  { key: 'overview', title: 'Visao Geral', icon: LayoutDashboard },
  { key: 'comprovacoes', title: 'Comprovacoes', icon: FileCheck },
  { key: 'materiais', title: 'Materiais', icon: Package },
  { key: 'relatorios', title: 'Relatorios', icon: BarChart3 },
  { key: 'parceiros', title: 'Parceiros', icon: Building2 },
  { key: 'certificados', title: 'Certificados', icon: Shield },
];

export const bottomNavItems: NavItem[] = [
  { key: 'configuracoes', title: 'Configuracoes', icon: Settings },
  { key: 'ajuda', title: 'Ajuda', icon: HelpCircle },
];

export const stats = [
  {
    title: 'Materiais Rastreados',
    value: '12.847',
    unit: 'kg',
    change: '+12.5%',
    trend: 'up',
    description: 'vs. mes anterior',
    tone: 'primary',
  },
  {
    title: 'Comprovacoes Ativas',
    value: '284',
    unit: '',
    change: '+8.2%',
    trend: 'up',
    description: 'certificados validos',
    tone: 'accent',
  },
  {
    title: 'Taxa de Reciclagem',
    value: '94.2',
    unit: '%',
    change: '+3.1%',
    trend: 'up',
    description: 'eficiencia do processo',
    tone: 'success',
  },
  {
    title: 'Impacto Ambiental',
    value: '2.4',
    unit: 'ton CO2',
    change: '-18.5%',
    trend: 'down',
    description: 'emissoes evitadas',
    tone: 'warning',
  },
];

export const comprovacoes: Comprovacao[] = [
  {
    id: 'COMP-001',
    hashLastro: '0x7f3a...8e2d',
    material: 'Plastico PET',
    quantidade: '1.250 kg',
    parceiro: 'RecycleTech Ltda',
    dataEmissao: '15 Mai 2026',
    status: 'verificado',
    tipo: 'Coleta',
  },
  {
    id: 'COMP-002',
    hashLastro: '0x9c4b...1f7a',
    material: 'Papelao',
    quantidade: '890 kg',
    parceiro: 'EcoPapel S.A.',
    dataEmissao: '14 Mai 2026',
    status: 'verificado',
    tipo: 'Reciclagem',
  },
  {
    id: 'COMP-003',
    hashLastro: '0x2d5e...4c8b',
    material: 'Vidro',
    quantidade: '2.100 kg',
    parceiro: 'VidroVerde Ind.',
    dataEmissao: '13 Mai 2026',
    status: 'pendente',
    tipo: 'Processamento',
  },
  {
    id: 'COMP-004',
    hashLastro: '0x8a1f...9d3c',
    material: 'Aluminio',
    quantidade: '450 kg',
    parceiro: 'MetalRecicla',
    dataEmissao: '10 Mai 2026',
    status: 'verificado',
    tipo: 'Coleta',
  },
  {
    id: 'COMP-005',
    hashLastro: '0x5e7d...2b9f',
    material: 'Plastico PEAD',
    quantidade: '780 kg',
    parceiro: 'PlastiCycle',
    dataEmissao: '08 Mai 2026',
    status: 'expirado',
    tipo: 'Destinacao',
  },
];

export const volumeData = [
  { mes: 'Jan', plastico: 1200, papel: 800, vidro: 600, metal: 400 },
  { mes: 'Fev', plastico: 1400, papel: 900, vidro: 700, metal: 450 },
  { mes: 'Mar', plastico: 1100, papel: 850, vidro: 650, metal: 380 },
  { mes: 'Abr', plastico: 1600, papel: 1000, vidro: 800, metal: 500 },
  { mes: 'Mai', plastico: 1800, papel: 1100, vidro: 900, metal: 550 },
];

export const materialDistribution = [
  { name: 'Plastico', value: 35, color: '#f06a35' },
  { name: 'Papel', value: 28, color: '#2bb6d6' },
  { name: 'Vidro', value: 22, color: '#31c484' },
  { name: 'Metal', value: 15, color: '#e6c75c' },
];

export const impactMetrics = [
  { title: 'CO2 Evitado', value: 2.4, target: 5, unit: 'ton' },
  { title: 'Agua Economizada', value: 12500, target: 20000, unit: 'L' },
  { title: 'Materiais Reciclados', value: 12847, target: 15000, unit: 'kg' },
  { title: 'Arvores Preservadas', value: 156, target: 200, unit: 'un' },
];

export const activities = [
  'COMP-001 verificada por RecycleTech',
  'Certificado de PlastiCycle aguardando revisao',
  'EcoPapel enviou novo comprovante fiscal',
  'Relatorio ESG de maio exportado',
];

export const materiais: MaterialItem[] = [
  { material: 'Plastico PET', volume: '4.620 kg', taxa: '94%', situacao: 'Alto volume' },
  { material: 'Papelao', volume: '3.180 kg', taxa: '91%', situacao: 'Coleta recorrente' },
  { material: 'Vidro', volume: '2.410 kg', taxa: '88%', situacao: 'Pendente validacao' },
  { material: 'Aluminio', volume: '1.050 kg', taxa: '96%', situacao: 'Certificado' },
  { material: 'Plastico PEAD', volume: '780 kg', taxa: '72%', situacao: 'Expirado' },
];

export const parceiros: PartnerItem[] = [
  { parceiro: 'RecycleTech Ltda', atuacao: 'Coleta e triagem', status: 'Homologado', sla: '98%' },
  { parceiro: 'EcoPapel S.A.', atuacao: 'Reciclagem de papel', status: 'Homologado', sla: '94%' },
  { parceiro: 'VidroVerde Ind.', atuacao: 'Processamento', status: 'Pendente', sla: '87%' },
  { parceiro: 'PlastiCycle', atuacao: 'Destinacao final', status: 'Documento vencido', sla: '76%' },
];

export const certificados: CertificateItem[] = [
  { id: 'CERT-2048', material: 'Plastico PET', status: 'Aprovado', data: '15 Mai 2026' },
  { id: 'CERT-2049', material: 'Papelao', status: 'Aprovado', data: '14 Mai 2026' },
  { id: 'CERT-2050', material: 'Vidro', status: 'Em analise', data: '13 Mai 2026' },
  { id: 'CERT-2051', material: 'PEAD', status: 'Rejeitado', data: '08 Mai 2026' },
];

export const relatorios: ReportItem[] = [
  { relatorio: 'Rastreabilidade completa', formato: 'PDF', status: 'Pronto' },
  { relatorio: 'Volume por unidade', formato: 'Excel', status: 'Pronto' },
  { relatorio: 'Divergencias abertas', formato: 'CSV', status: 'Gerando' },
  { relatorio: 'Comprovatorio fiscal', formato: 'PDF', status: 'Pendente' },
];

export const configuracoes: SettingItem[] = [
  { title: 'Margem de tolerancia de peso', description: 'Configuracao operacional para validar comprovacoes e certificados.', progress: 82 },
  { title: 'Campos obrigatorios', description: 'Configuracao operacional para validar comprovacoes e certificados.', progress: 65 },
  { title: 'Regras de aprovacao', description: 'Configuracao operacional para validar comprovacoes e certificados.', progress: 91 },
  { title: 'Notificacoes fiscais', description: 'Configuracao operacional para validar comprovacoes e certificados.', progress: 48 },
];

export const ajuda: HelpItem[] = [
  {
    title: 'Central de ajuda',
    description: 'Guias para registrar comprovacoes, homologar parceiros, validar certificados e gerar relatorios ESG.',
    action: 'comprovacoes',
  },
  {
    title: 'Checklist de implantacao',
    description: 'Empresa, unidades, materiais, parceiros, templates e certificados iniciais.',
    action: 'configuracoes',
  },
];

export const initialDashboard: DashboardData = {
  shell: {
    brandName: 'Troia Trace',
    brandSubtitle: 'Logistica Reversa',
    period: 'Maio 2026',
    user: {
      name: 'Empresa Corp',
      role: 'Admin',
    },
    notificationsCount: 3,
    pages: [
      { key: 'overview', title: 'Visao Geral', subtitle: 'Acompanhe suas comprovacoes de logistica reversa.', section: 'menu' },
      { key: 'comprovacoes', title: 'Comprovacoes', subtitle: 'Consulte e registre operacoes com hash de lastro.', section: 'menu' },
      { key: 'materiais', title: 'Materiais', subtitle: 'Controle volumes, categorias e eficiencia por material.', section: 'menu' },
      { key: 'relatorios', title: 'Relatorios', subtitle: 'Exporte rastreabilidade, fiscalizacao e indicadores ESG.', section: 'menu' },
      { key: 'parceiros', title: 'Parceiros', subtitle: 'Acompanhe cooperativas, recicladoras e terceiros.', section: 'menu' },
      { key: 'certificados', title: 'Certificados', subtitle: 'Valide laudos e certificados vinculados ao lastro.', section: 'menu' },
      { key: 'configuracoes', title: 'Configuracoes', subtitle: 'Ajuste regras, tolerancias, notificacoes e permissao.', section: 'system' },
      { key: 'ajuda', title: 'Ajuda', subtitle: 'Encontre orientacoes para operar a plataforma.', section: 'system' },
    ],
  },
  stats,
  comprovacoes,
  volumeData,
  materialDistribution,
  impactMetrics,
  activities,
  materiais,
  parceiros,
  certificados,
  relatorios,
  configuracoes,
  ajuda,
};
