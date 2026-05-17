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

export const navItems: NavItem[] = [
  { key: 'overview', title: 'Visão Geral', icon: LayoutDashboard },
  { key: 'comprovacoes', title: 'Comprovações', icon: FileCheck },
  { key: 'materiais', title: 'Materiais', icon: Package },
  { key: 'relatorios', title: 'Relatórios', icon: BarChart3 },
  { key: 'parceiros', title: 'Parceiros', icon: Building2 },
  { key: 'certificados', title: 'Certificados', icon: Shield },
];

export const bottomNavItems: NavItem[] = [
  { key: 'configuracoes', title: 'Configurações', icon: Settings },
  { key: 'ajuda', title: 'Ajuda', icon: HelpCircle },
];

export const emptyDashboard: DashboardData = {
  shell: {
    brandName: '',
    brandSubtitle: '',
    period: '',
    user: {
      name: '',
      role: '',
    },
    notificationsCount: 0,
    pages: [],
  },
  stats: [],
  comprovacoes: [],
  volumeData: [],
  materialDistribution: [],
  impactMetrics: [],
  activities: [],
  materiais: [],
  parceiros: [],
  certificados: [],
  relatorios: [],
  configuracoes: [],
  ajuda: [],
};
