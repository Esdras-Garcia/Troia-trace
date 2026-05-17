import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import {
  Bell,
  CheckCircle2,
  Clock,
  Copy,
  FileCheck,
  Filter,
  Leaf,
  Plus,
  Recycle,
  Search,
  User,
  Wind,
} from 'lucide-react-native';

import { DistributionChart, VolumeChart } from '../components/Charts';
import { NovaComprovacaoModal } from '../components/NovaComprovacaoModal';
import { Badge, Button, Card, colors, Input, Progress, SectionTitle, StatCard } from '../components/ui';
import {
  getAjuda,
  getCertificados,
  getComprovacoes,
  getConfiguracoes,
  getDashboard,
  getMateriais,
  getParceiros,
  getRelatorios,
} from '../api/client';
import {
  bottomNavItems,
  Comprovacao,
  DashboardData,
  HelpItem,
  initialDashboard,
  navItems,
  PageKey,
  SettingItem,
} from '../data/dashboard';

export function HomeScreen() {
  const [activePage, setActivePage] = useState<PageKey>('overview');
  const [query, setQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardData>(initialDashboard);
  const { width } = useWindowDimensions();
  const isWide = width >= 980;

  useEffect(() => {
    let active = true;

    async function loadPage() {
      try {
        if (activePage === 'overview') {
          const data = await getDashboard();
          if (active) {
            setDashboard(data);
          }
          return;
        }

        if (activePage === 'comprovacoes') {
          const comprovacoes = await getComprovacoes(query);
          if (active) {
            setDashboard((current) => ({ ...current, comprovacoes }));
          }
          return;
        }

        if (activePage === 'materiais') {
          const materiais = await getMateriais();
          if (active) {
            setDashboard((current) => ({ ...current, materiais }));
          }
          return;
        }

        if (activePage === 'relatorios') {
          const relatorios = await getRelatorios();
          if (active) {
            setDashboard((current) => ({ ...current, relatorios }));
          }
          return;
        }

        if (activePage === 'parceiros') {
          const parceiros = await getParceiros();
          if (active) {
            setDashboard((current) => ({ ...current, parceiros }));
          }
          return;
        }

        if (activePage === 'certificados') {
          const certificados = await getCertificados();
          if (active) {
            setDashboard((current) => ({ ...current, certificados }));
          }
          return;
        }

        if (activePage === 'configuracoes') {
          const configuracoes = await getConfiguracoes();
          if (active) {
            setDashboard((current) => ({ ...current, configuracoes }));
          }
          return;
        }

        const ajuda = await getAjuda();
        if (active) {
          setDashboard((current) => ({ ...current, ajuda }));
        }
      } catch {
        if (active) {
          setDashboard(initialDashboard);
        }
      }
    }

    loadPage();

    return () => {
      active = false;
    };
  }, [activePage, query]);

  const pageTitle = [...navItems, ...bottomNavItems].find((item) => item.key === activePage)?.title ?? 'Visao Geral';

  return (
    <View style={styles.app}>
      <NovaComprovacaoModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreated={(comprovacao) => setDashboard((current) => ({ ...current, comprovacoes: [comprovacao, ...current.comprovacoes] }))}
      />
      {isWide ? <Sidebar activePage={activePage} onNavigate={setActivePage} /> : null}
      <View style={styles.contentShell}>
        <TopHeader
          activePage={activePage}
          isWide={isWide}
          query={query}
          onChangeQuery={setQuery}
          onOpenModal={() => setModalVisible(true)}
          onNavigate={setActivePage}
        />
        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
          <View style={styles.pageHeader}>
            <SectionTitle title={pageTitle} subtitle={subtitleFor(activePage)} />
            <View style={styles.pageActions}>
              <Text style={styles.period}>Maio 2026</Text>
              <Button onPress={() => setModalVisible(true)}>
                <Text style={styles.buttonInline}>+ Nova Comprovacao</Text>
              </Button>
            </View>
          </View>
          <PageContent activePage={activePage} query={query} isWide={isWide} dashboard={dashboard} onNavigate={setActivePage} />
        </ScrollView>
      </View>
    </View>
  );
}

function Sidebar({ activePage, onNavigate }: { activePage: PageKey; onNavigate: (page: PageKey) => void }) {
  return (
    <View style={styles.sidebar}>
      <View style={styles.brand}>
        <View style={styles.brandIcon}>
          <Recycle color="#fff" size={22} />
        </View>
        <View>
          <Text style={styles.brandTitle}>Troia Trace</Text>
          <Text style={styles.brandSubtitle}>Logistica Reversa</Text>
        </View>
      </View>
      <View style={styles.navSection}>
        <Text style={styles.navLabel}>Menu</Text>
        {navItems.map((item) => (
          <NavButton key={item.key} active={activePage === item.key} item={item} onPress={() => onNavigate(item.key)} />
        ))}
      </View>
      <View style={styles.navFooter}>
        <Text style={styles.navLabel}>Sistema</Text>
        {bottomNavItems.map((item) => (
          <NavButton key={item.key} active={activePage === item.key} item={item} onPress={() => onNavigate(item.key)} />
        ))}
      </View>
    </View>
  );
}

function NavButton({
  active,
  item,
  onPress,
}: {
  active: boolean;
  item: { title: string; icon: React.ComponentType<{ color?: string; size?: number }> };
  onPress: () => void;
}) {
  const Icon = item.icon;
  return (
    <Pressable style={[styles.navButton, active && styles.navButtonActive]} onPress={onPress}>
      <Icon color={active ? '#fff' : colors.muted} size={20} />
      <Text style={[styles.navText, active && styles.navTextActive]}>{item.title}</Text>
    </Pressable>
  );
}

function TopHeader({
  activePage,
  isWide,
  query,
  onChangeQuery,
  onOpenModal,
  onNavigate,
}: {
  activePage: PageKey;
  isWide: boolean;
  query: string;
  onChangeQuery: (value: string) => void;
  onOpenModal: () => void;
  onNavigate: (page: PageKey) => void;
}) {
  if (!isWide) {
    return (
      <View style={styles.headerMobile}>
        <View style={styles.headerMobileTop}>
          <View style={styles.searchWrap}>
            <Search color={colors.muted} size={18} />
            <Input
              value={query}
              onChangeText={onChangeQuery}
              placeholder="Buscar..."
              style={styles.searchInput}
            />
          </View>
          <Pressable style={styles.iconButton} onPress={onOpenModal}>
            <Plus color={colors.text} size={18} />
          </Pressable>
          <View style={styles.iconButton}>
            <Bell color={colors.text} size={18} />
            <View style={styles.notificationDot}>
              <Text style={styles.notificationText}>3</Text>
            </View>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mobileNav}>
          {[...navItems, ...bottomNavItems].map((item) => (
            <Pressable
              key={item.key}
              style={[styles.mobileNavItem, activePage === item.key && styles.mobileNavItemActive]}
              onPress={() => onNavigate(item.key)}
            >
              <Text style={[styles.mobileNavText, activePage === item.key && styles.mobileNavTextActive]}>{item.title}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.header}>
      <View style={styles.searchWrap}>
        <Search color={colors.muted} size={18} />
        <Input
          value={query}
          onChangeText={onChangeQuery}
          placeholder="Buscar comprovacoes, materiais..."
          style={styles.searchInput}
        />
      </View>
      <View style={styles.headerActions}>
        <Pressable style={styles.iconButton} onPress={onOpenModal}>
          <Plus color={colors.text} size={18} />
        </Pressable>
        <View style={styles.iconButton}>
          <Bell color={colors.text} size={18} />
          <View style={styles.notificationDot}>
            <Text style={styles.notificationText}>3</Text>
          </View>
        </View>
        <View style={styles.userChip}>
          <User color={colors.primary} size={16} />
          <View>
            <Text style={styles.userName}>Empresa Corp</Text>
            <Text style={styles.userRole}>Admin</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function PageContent({
  activePage,
  query,
  isWide,
  dashboard,
  onNavigate,
}: {
  activePage: PageKey;
  query: string;
  isWide: boolean;
  dashboard: DashboardData;
  onNavigate: (page: PageKey) => void;
}) {
  if (activePage === 'overview') {
    return <OverviewPage query={query} isWide={isWide} dashboard={dashboard} />;
  }
  if (activePage === 'comprovacoes') {
    return <ComprovacoesPage query={query} comprovacoes={dashboard.comprovacoes} />;
  }
  if (activePage === 'materiais') {
    return <SimpleListPage data={dashboard.materiais} title="Materiais monitorados" columns={['Material', 'Volume', 'Taxa', 'Situacao']} />;
  }
  if (activePage === 'relatorios') {
    return <SimpleListPage data={dashboard.relatorios} title="Relatorios disponiveis" columns={['Relatorio', 'Formato', 'Status']} />;
  }
  if (activePage === 'parceiros') {
    return <SimpleListPage data={dashboard.parceiros} title="Rede de parceiros" columns={['Parceiro', 'Atuacao', 'Status', 'SLA']} />;
  }
  if (activePage === 'certificados') {
    return <SimpleListPage data={dashboard.certificados} title="Certificados e laudos" columns={['ID', 'Material', 'Status', 'Data']} />;
  }
  if (activePage === 'configuracoes') {
    return <SettingsPage settings={dashboard.configuracoes} />;
  }
  return <HelpPage items={dashboard.ajuda} onNavigate={onNavigate} />;
}

function OverviewPage({ query, isWide, dashboard }: { query: string; isWide: boolean; dashboard: DashboardData }) {
  return (
    <View style={styles.stack}>
      <View style={[styles.statsGrid, !isWide && styles.statsGridMobile]}>
        {dashboard.stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </View>
      <View style={styles.gridRow}>
        <VolumeChart volumeData={dashboard.volumeData} />
        <DistributionChart materialDistribution={dashboard.materialDistribution} />
      </View>
      <View style={styles.gridRow}>
        <ComprovacoesTable query={query} comprovacoes={dashboard.comprovacoes} compact />
        <View style={styles.sideColumn}>
          <ImpactMetrics metrics={dashboard.impactMetrics} />
          <RecentActivity activities={dashboard.activities} />
        </View>
      </View>
    </View>
  );
}

function ComprovacoesPage({ query, comprovacoes }: { query: string; comprovacoes: Comprovacao[] }) {
  return (
    <View style={styles.stack}>
      <Card style={styles.toolbarCard}>
        <View style={styles.toolbar}>
          <Badge tone="primary">Lastro rastreavel</Badge>
          <Button variant="outline">
            <Text style={styles.buttonInline}>Filtrar</Text>
          </Button>
        </View>
      </Card>
      <ComprovacoesTable query={query} comprovacoes={comprovacoes} />
    </View>
  );
}

function ComprovacoesTable({ query, comprovacoes, compact = false }: { query: string; comprovacoes: Comprovacao[]; compact?: boolean }) {
  const filtered = useMemo(
    () =>
      comprovacoes.filter((item) => {
        const text = `${item.id} ${item.material} ${item.parceiro}`.toLowerCase();
        return text.includes(query.toLowerCase());
      }),
    [comprovacoes, query],
  );

  return (
    <Card style={styles.tableCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Comprovacoes Recentes</Text>
        <Filter color={colors.muted} size={18} />
      </View>
      <View style={styles.table}>
        {filtered.map((item) => (
          <ComprovacaoRow key={item.id} item={item} compact={compact} />
        ))}
      </View>
    </Card>
  );
}

function ComprovacaoRow({ item, compact }: { item: Comprovacao; compact: boolean }) {
  return (
    <View style={styles.tableRow}>
      <View style={styles.tableMain}>
        <Text style={styles.tableId}>{item.id}</Text>
        <Text style={styles.tableSub}>{item.material} • {item.tipo}</Text>
      </View>
      {!compact ? (
        <View style={styles.hashPill}>
          <Text style={styles.hashText}>{item.hashLastro}</Text>
          <Copy color={colors.muted} size={13} />
        </View>
      ) : null}
      <Text style={styles.tableValue}>{item.quantidade}</Text>
      <Text style={styles.tablePartner}>{item.parceiro}</Text>
      <StatusBadge status={item.status} />
    </View>
  );
}

function StatusBadge({ status }: { status: Comprovacao['status'] }) {
  const tone = status === 'verificado' ? 'success' : status === 'pendente' ? 'accent' : 'danger';
  const label = status === 'verificado' ? 'Verificado' : status === 'pendente' ? 'Pendente' : 'Expirado';
  const Icon = status === 'verificado' ? CheckCircle2 : Clock;
  return (
    <Badge tone={tone}>
      <View style={styles.statusContent}>
        <Icon color={status === 'verificado' ? colors.success : status === 'pendente' ? colors.accent : colors.danger} size={12} />
        <Text style={[styles.statusText, { color: status === 'verificado' ? colors.success : status === 'pendente' ? colors.accent : colors.danger }]}>
          {label}
        </Text>
      </View>
    </Badge>
  );
}

function ImpactMetrics({ metrics }: { metrics: DashboardData['impactMetrics'] }) {
  return (
    <Card style={styles.sideCard}>
      <View style={styles.cardTitleRow}>
        <Leaf color={colors.primary} size={18} />
        <Text style={styles.cardTitle}>Impacto Ambiental</Text>
      </View>
      {metrics.map((metric, index) => {
        const percentage = Math.round((metric.value / metric.target) * 100);
        const color = [colors.primary, colors.accent, colors.success, colors.warning][index];
        return (
          <View key={metric.title} style={styles.metricBlock}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricTitle}>{metric.title}</Text>
              <Text style={styles.metricValue}>
                {metric.value.toLocaleString('pt-BR')} / {metric.target.toLocaleString('pt-BR')} {metric.unit}
              </Text>
            </View>
            <Progress value={percentage} color={color} />
            <Text style={styles.metricPercent}>{percentage}% da meta</Text>
          </View>
        );
      })}
    </Card>
  );
}

function RecentActivity({ activities }: { activities: string[] }) {
  return (
    <Card style={styles.sideCard}>
      <Text style={styles.cardTitle}>Atividade Recente</Text>
      {activities.map((activity, index) => (
        <View key={activity} style={styles.activityRow}>
          <View style={[styles.activityDot, { backgroundColor: index === 1 ? colors.accent : colors.primary }]} />
          <Text style={styles.activityText}>{activity}</Text>
        </View>
      ))}
    </Card>
  );
}

function SimpleListPage({ title, columns, data }: { title: string; columns: string[]; data: string[][] }) {
  return (
    <View style={styles.stack}>
      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Badge tone="primary">Atualizado</Badge>
        </View>
        <View style={styles.listHeader}>
          {columns.map((column) => (
            <Text key={column} style={styles.listHeaderText}>{column}</Text>
          ))}
        </View>
        {data.map((row) => (
          <View key={row.join('-')} style={styles.listRow}>
            {row.map((cell, index) => (
              <Text key={cell} style={[styles.listCell, index === 0 && styles.listCellStrong]}>{cell}</Text>
            ))}
          </View>
        ))}
      </Card>
    </View>
  );
}

function SettingsPage({ settings }: { settings: SettingItem[] }) {
  return (
    <View style={styles.settingsGrid}>
      {settings.map((item, index) => (
        <Card key={item.title} style={styles.settingCard}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.tableSub}>{item.description}</Text>
          <Progress value={item.progress} color={[colors.primary, colors.accent, colors.success, colors.warning][index]} />
        </Card>
      ))}
    </View>
  );
}

function HelpPage({ items, onNavigate }: { items: HelpItem[]; onNavigate: (page: PageKey) => void }) {
  return (
    <View style={styles.gridRow}>
      <Card style={styles.helpCard}>
        <Wind color={colors.primary} size={28} />
        <Text style={styles.helpTitle}>{items[0]?.title ?? 'Central de ajuda'}</Text>
        <Text style={styles.helpText}>{items[0]?.description}</Text>
        <Button onPress={() => onNavigate(items[0]?.action ?? 'comprovacoes')}>Abrir comprovacoes</Button>
      </Card>
      <Card style={styles.helpCard}>
        <FileCheck color={colors.accent} size={28} />
        <Text style={styles.helpTitle}>{items[1]?.title ?? 'Checklist de implantacao'}</Text>
        <Text style={styles.helpText}>{items[1]?.description}</Text>
        <Button variant="outline" onPress={() => onNavigate(items[1]?.action ?? 'configuracoes')}>Ver configuracoes</Button>
      </Card>
    </View>
  );
}

function subtitleFor(page: PageKey) {
  const subtitles: Record<PageKey, string> = {
    overview: 'Acompanhe suas comprovacoes de logistica reversa.',
    comprovacoes: 'Consulte e registre operacoes com hash de lastro.',
    materiais: 'Controle volumes, categorias e eficiencia por material.',
    relatorios: 'Exporte rastreabilidade, fiscalizacao e indicadores ESG.',
    parceiros: 'Acompanhe cooperativas, recicladoras e terceiros.',
    certificados: 'Valide laudos e certificados vinculados ao lastro.',
    configuracoes: 'Ajuste regras, tolerancias, notificacoes e permissao.',
    ajuda: 'Encontre orientacoes para operar a plataforma.',
  };
  return subtitles[page];
}

const styles = StyleSheet.create({
  app: {
    backgroundColor: colors.background,
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    backgroundColor: colors.sidebar,
    borderColor: colors.border,
    borderRightWidth: 1,
    width: 264,
  },
  brand: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  brandIcon: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 14,
    width: 42,
  },
  brandTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  brandSubtitle: {
    color: colors.muted,
    fontSize: 12,
  },
  navSection: {
    flex: 1,
    gap: 6,
    padding: 12,
  },
  navFooter: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 6,
    padding: 12,
  },
  navLabel: {
    color: `${colors.muted}99`,
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 4,
    paddingHorizontal: 10,
    textTransform: 'uppercase',
  },
  navButton: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 12,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  navButtonActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  navText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800',
  },
  navTextActive: {
    color: '#fff',
  },
  contentShell: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#10131ccc',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'space-between',
    minHeight: 68,
    paddingHorizontal: 18,
  },
  headerMobile: {
    backgroundColor: '#10131ccc',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    gap: 10,
    padding: 10,
  },
  headerMobileTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  searchWrap: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    maxWidth: 520,
  },
  searchInput: {
    flex: 1,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  mobileNav: {
    gap: 8,
    paddingRight: 10,
  },
  mobileNavItem: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  mobileNavItemActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  mobileNavText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
  },
  mobileNavTextActive: {
    color: '#fff',
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  notificationDot: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 9,
    height: 18,
    justifyContent: 'center',
    position: 'absolute',
    right: -5,
    top: -5,
    width: 18,
  },
  notificationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  userChip: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 42,
    paddingHorizontal: 10,
  },
  userName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  userRole: {
    color: colors.muted,
    fontSize: 11,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    gap: 20,
    padding: 20,
    paddingBottom: 42,
  },
  pageHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'space-between',
  },
  pageActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  period: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  buttonInline: {
    color: '#fff',
    fontWeight: '900',
  },
  stack: {
    gap: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  statsGridMobile: {
    flexDirection: 'column',
  },
  gridRow: {
    alignItems: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
  },
  sideColumn: {
    flex: 1,
    gap: 18,
    minWidth: 300,
  },
  sideCard: {
    gap: 16,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  tableCard: {
    flex: 2,
    minWidth: 320,
  },
  table: {
    gap: 8,
  },
  tableRow: {
    alignItems: 'center',
    backgroundColor: colors.cardSoft,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    padding: 12,
  },
  tableMain: {
    flex: 1.4,
    minWidth: 130,
  },
  tableId: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  tableSub: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
  },
  hashPill: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 6,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  hashText: {
    color: colors.muted,
    fontFamily: 'monospace',
    fontSize: 12,
  },
  tableValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
    minWidth: 74,
  },
  tablePartner: {
    color: colors.muted,
    fontSize: 13,
    minWidth: 120,
  },
  statusContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '900',
  },
  metricBlock: {
    gap: 7,
  },
  metricHeader: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  metricTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  metricValue: {
    color: colors.muted,
    fontSize: 12,
  },
  metricPercent: {
    color: colors.muted,
    fontSize: 11,
    textAlign: 'right',
  },
  activityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  activityDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  activityText: {
    color: colors.muted,
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  toolbarCard: {
    padding: 12,
  },
  toolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  listHeader: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 10,
  },
  listHeaderText: {
    color: colors.muted,
    flex: 1,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  listRow: {
    alignItems: 'center',
    borderBottomColor: `${colors.border}88`,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 14,
  },
  listCell: {
    color: colors.muted,
    flex: 1,
    fontSize: 13,
  },
  listCellStrong: {
    color: colors.text,
    fontWeight: '900',
  },
  settingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  settingCard: {
    flex: 1,
    gap: 12,
    minWidth: 260,
  },
  helpCard: {
    flex: 1,
    gap: 14,
    minWidth: 280,
  },
  helpTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  helpText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
});
