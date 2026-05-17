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

export const materiais = [
  ['Plastico PET', '4.620 kg', '94%', 'Alto volume'],
  ['Papelao', '3.180 kg', '91%', 'Coleta recorrente'],
  ['Vidro', '2.410 kg', '88%', 'Pendente validacao'],
  ['Aluminio', '1.050 kg', '96%', 'Certificado'],
  ['Plastico PEAD', '780 kg', '72%', 'Expirado'],
];

export const parceiros = [
  ['RecycleTech Ltda', 'Coleta e triagem', 'Homologado', '98%'],
  ['EcoPapel S.A.', 'Reciclagem de papel', 'Homologado', '94%'],
  ['VidroVerde Ind.', 'Processamento', 'Pendente', '87%'],
  ['PlastiCycle', 'Destinacao final', 'Documento vencido', '76%'],
];

export const certificados = [
  ['CERT-2048', 'Plastico PET', 'Aprovado', '15 Mai 2026'],
  ['CERT-2049', 'Papelao', 'Aprovado', '14 Mai 2026'],
  ['CERT-2050', 'Vidro', 'Em analise', '13 Mai 2026'],
  ['CERT-2051', 'PEAD', 'Rejeitado', '08 Mai 2026'],
];

export const relatorios = [
  ['Rastreabilidade completa', 'PDF', 'Pronto'],
  ['Volume por unidade', 'Excel', 'Pronto'],
  ['Divergencias abertas', 'CSV', 'Gerando'],
  ['Comprovatorio fiscal', 'PDF', 'Pendente'],
];
