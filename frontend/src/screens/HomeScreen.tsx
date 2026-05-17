import { createElement, useEffect, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import {
  Bell,
  Building2,
  ChevronDown,
  CheckCircle2,
  Clock,
  Copy,
  FileCheck,
  Leaf,
  LogOut,
  Recycle,
  Search,
  User,
  Wind,
  X,
} from 'lucide-react-native';

import { DistributionChart, VolumeChart } from '../components/Charts';
import { NovaComprovacaoModal } from '../components/NovaComprovacaoModal';
import { Badge, Button, Card, colors, Input, Progress, SectionTitle, StatCard } from '../components/ui';
import {
  getAjuda,
  getCertificados,
  getCompanyProfile,
  getComprovacoes,
  getConfiguracoes,
  getDashboard,
  getMateriais,
  getNotifications,
  getParceiros,
  getRelatorios,
  logout,
  markNotificationRead,
  updateComprovacaoStatus,
  updateComprovacao,
  type ComprovacaoAction,
  type ComprovacaoActionPayload,
  type UpdateComprovacaoPayload,
} from '../api/client';
import {
  bottomNavItems,
  Comprovacao,
  ComprovacaoStatus,
  CompanyProfile,
  DashboardData,
  emptyDashboard,
  HelpItem,
  NotificationItem,
  navItems,
  PageKey,
  SettingItem,
} from '../data/dashboard';

type ComprovacaoSort = 'recentes' | 'antigas' | 'maior-peso' | 'menor-peso' | 'material' | 'parceiro';

export function HomeScreen({ onLoggedOut }: { onLoggedOut: () => void }) {
  const [activePage, setActivePage] = useState<PageKey>('overview');
  const [query, setQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardData>(emptyDashboard);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [editingComprovacao, setEditingComprovacao] = useState<Comprovacao | null>(null);
  const [focusedComprovacaoId, setFocusedComprovacaoId] = useState('');
  const [loggedOut, setLoggedOut] = useState(false);
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
          const materiais = await getMateriais(query);
          if (active) {
            setDashboard((current) => ({ ...current, materiais }));
          }
          return;
        }

        if (activePage === 'relatorios') {
          const relatorios = await getRelatorios(query);
          if (active) {
            setDashboard((current) => ({ ...current, relatorios }));
          }
          return;
        }

        if (activePage === 'parceiros') {
          const parceiros = await getParceiros(query);
          if (active) {
            setDashboard((current) => ({ ...current, parceiros }));
          }
          return;
        }

        if (activePage === 'certificados') {
          const certificados = await getCertificados(query);
          if (active) {
            setDashboard((current) => ({ ...current, certificados }));
          }
          return;
        }

        if (activePage === 'configuracoes') {
          const configuracoes = await getConfiguracoes(query);
          if (active) {
            setDashboard((current) => ({ ...current, configuracoes }));
          }
          return;
        }

        const ajuda = await getAjuda(query);
        if (active) {
          setDashboard((current) => ({ ...current, ajuda }));
        }
      } catch {
        if (active) {
          setDashboard(emptyDashboard);
        }
      }
    }

    loadPage();

    return () => {
      active = false;
    };
  }, [activePage, query]);

  const pageMetadata = dashboard.shell.pages.find((item) => item.key === activePage);
  const pageTitle = displayText(pageMetadata?.title ?? [...navItems, ...bottomNavItems].find((item) => item.key === activePage)?.title ?? 'Visão Geral');
  const canCreateComprovacao = activePage === 'comprovacoes';
  const unreadNotifications = notifications.filter((item) => !item.read).length || dashboard.shell.notificationsCount;

  async function openNotifications() {
    const items = await getNotifications();
    setNotifications(items);
    setNotificationsOpen(true);
    setProfileOpen(false);
  }

  async function readNotification(id: string) {
    const updated = await markNotificationRead(id);
    setNotifications((current) => current.map((item) => (item.id === id ? updated : item)));
    setDashboard((current) => ({
      ...current,
      shell: {
        ...current.shell,
        notificationsCount: Math.max(0, current.shell.notificationsCount - 1),
      },
    }));
  }

  async function openProfile() {
    const profile = await getCompanyProfile();
    setCompanyProfile(profile);
    setProfileOpen(true);
    setNotificationsOpen(false);
  }

  async function handleLogout() {
    const response = await logout();
    if (response.loggedOut) {
      onLoggedOut();
      setLoggedOut(true);
      setProfileOpen(false);
      setNotificationsOpen(false);
      setDashboard(emptyDashboard);
    }
  }

  async function handleComprovacaoAction(id: string, action: ComprovacaoAction, payload?: ComprovacaoActionPayload) {
    const updated = await updateComprovacaoStatus(id, action, payload);
    setDashboard((current) => ({
      ...current,
      comprovacoes: current.comprovacoes.map((item) => (item.id === updated.id ? updated : item)),
    }));
    setFocusedComprovacaoId(updated.id);
  }

  async function handleUpdateComprovacao(id: string, payload: UpdateComprovacaoPayload) {
    const updated = await updateComprovacao(id, payload);
    setDashboard((current) => ({
      ...current,
      comprovacoes: current.comprovacoes.map((item) => (item.id === updated.id ? updated : item)),
    }));
    setEditingComprovacao(null);
    setFocusedComprovacaoId(updated.id);
  }

  function handleViewCreatedComprovacao(comprovacao: Comprovacao) {
    setActivePage('comprovacoes');
    setQuery('');
    setFocusedComprovacaoId(comprovacao.id);
  }

  if (loggedOut) {
    return (
      <View style={styles.logoutScreen}>
        <Card style={styles.logoutCard}>
          <LogOut color={colors.primary} size={28} />
          <Text style={styles.logoutTitle}>Sessão encerrada</Text>
          <Text style={styles.logoutText}>Use o fluxo de autenticação da aplicação para entrar novamente.</Text>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.app}>
      <NovaComprovacaoModal
        visible={modalVisible}
        materiais={dashboard.materiais}
        parceiros={dashboard.parceiros}
        onClose={() => setModalVisible(false)}
        onCreated={(comprovacao) => setDashboard((current) => ({ ...current, comprovacoes: [comprovacao, ...current.comprovacoes] }))}
        onViewCreated={handleViewCreatedComprovacao}
      />
      {editingComprovacao ? (
        <EditComprovacaoModal
          key={`${editingComprovacao.id}-${editingComprovacao.status}`}
          comprovacao={editingComprovacao}
          materiais={dashboard.materiais}
          parceiros={dashboard.parceiros}
          onClose={() => setEditingComprovacao(null)}
          onSave={handleUpdateComprovacao}
        />
      ) : null}
      {isWide ? <Sidebar activePage={activePage} dashboard={dashboard} onNavigate={setActivePage} /> : null}
      <View style={styles.contentShell}>
        <TopHeader
          activePage={activePage}
          isWide={isWide}
          query={query}
          dashboard={dashboard}
          notificationsCount={unreadNotifications}
          onChangeQuery={setQuery}
          onOpenNotifications={openNotifications}
          onOpenProfile={openProfile}
          onLogout={handleLogout}
          onNavigate={setActivePage}
        />
        {notificationsOpen ? (
          <NotificationsPanel
            notifications={notifications}
            onClose={() => setNotificationsOpen(false)}
            onRead={readNotification}
          />
        ) : null}
        {profileOpen ? (
          <ProfilePanel
            profile={companyProfile}
            onClose={() => setProfileOpen(false)}
            onLogout={handleLogout}
          />
        ) : null}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
          <View style={styles.pageHeader}>
            <SectionTitle title={pageTitle} subtitle={displayText(pageMetadata?.subtitle)} />
            <View style={styles.pageActions}>
              <Text style={styles.period}>{dashboard.shell.period}</Text>
              {canCreateComprovacao ? (
                <Button onPress={() => setModalVisible(true)}>
                  <Text style={styles.buttonInline}>+ Nova Comprovação</Text>
                </Button>
              ) : null}
            </View>
          </View>
          <PageContent
            activePage={activePage}
            query={query}
            isWide={isWide}
            dashboard={dashboard}
            onNavigate={setActivePage}
            onComprovacaoAction={handleComprovacaoAction}
            onEditComprovacao={setEditingComprovacao}
            focusedComprovacaoId={focusedComprovacaoId}
          />
        </ScrollView>
      </View>
    </View>
  );
}

function Sidebar({ activePage, dashboard, onNavigate }: { activePage: PageKey; dashboard: DashboardData; onNavigate: (page: PageKey) => void }) {
  return (
    <View style={styles.sidebar}>
      <View style={styles.brand}>
        <View style={styles.brandIcon}>
          <Recycle color="#fff" size={22} />
        </View>
        <View>
          <Text style={styles.brandTitle}>{dashboard.shell.brandName}</Text>
          <Text style={styles.brandSubtitle}>{displayText(dashboard.shell.brandSubtitle)}</Text>
        </View>
      </View>
      <View style={styles.navSection}>
        <Text style={styles.navLabel}>Menu</Text>
        {navItems.map((item) => (
          <NavButton key={item.key} active={activePage === item.key} item={{ ...item, title: pageTitleFor(dashboard, item.key) }} onPress={() => onNavigate(item.key)} />
        ))}
      </View>
      <View style={styles.navFooter}>
        <Text style={styles.navLabel}>Sistema</Text>
        {bottomNavItems.map((item) => (
          <NavButton key={item.key} active={activePage === item.key} item={{ ...item, title: pageTitleFor(dashboard, item.key) }} onPress={() => onNavigate(item.key)} />
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
  dashboard,
  notificationsCount,
  onChangeQuery,
  onOpenNotifications,
  onOpenProfile,
  onLogout,
  onNavigate,
}: {
  activePage: PageKey;
  isWide: boolean;
  query: string;
  dashboard: DashboardData;
  notificationsCount: number;
  onChangeQuery: (value: string) => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
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
            maxLength={80}
            style={styles.searchInput}
          />
        </View>
        <Pressable style={styles.iconButton} onPress={onOpenNotifications}>
          <Bell color={colors.text} size={18} />
            <View style={styles.notificationDot}>
              <Text style={styles.notificationText}>{notificationsCount}</Text>
            </View>
          </Pressable>
          <Pressable style={styles.iconButton} onPress={onOpenProfile}>
            <User color={colors.primary} size={18} />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={onLogout}>
            <LogOut color={colors.text} size={18} />
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mobileNav}>
          {[...navItems, ...bottomNavItems].map((item) => (
            <Pressable
              key={item.key}
              style={[styles.mobileNavItem, activePage === item.key && styles.mobileNavItemActive]}
              onPress={() => onNavigate(item.key)}
            >
              <Text style={[styles.mobileNavText, activePage === item.key && styles.mobileNavTextActive]}>{displayText(pageTitleFor(dashboard, item.key))}</Text>
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
          placeholder="Buscar comprovações, materiais..."
          maxLength={80}
          style={styles.searchInput}
        />
      </View>
      <View style={styles.headerActions}>
        <Pressable style={styles.iconButton} onPress={onOpenNotifications}>
          <Bell color={colors.text} size={18} />
          <View style={styles.notificationDot}>
            <Text style={styles.notificationText}>{notificationsCount}</Text>
          </View>
        </Pressable>
        <Pressable style={styles.userChip} onPress={onOpenProfile}>
          <User color={colors.primary} size={16} />
          <View>
            <Text style={styles.userName}>{dashboard.shell.user.name}</Text>
            <Text style={styles.userRole}>{dashboard.shell.user.role}</Text>
          </View>
        </Pressable>
        <Pressable style={styles.iconButton} onPress={onLogout}>
          <LogOut color={colors.text} size={18} />
        </Pressable>
      </View>
    </View>
  );
}

function NotificationsPanel({
  notifications,
  onClose,
  onRead,
}: {
  notifications: NotificationItem[];
  onClose: () => void;
  onRead: (id: string) => void;
}) {
  return (
    <Card style={styles.floatingPanel}>
      <View style={styles.panelHeader}>
        <Text style={styles.cardTitle}>Notificações</Text>
        <Pressable style={styles.panelClose} onPress={onClose}>
          <X color={colors.text} size={16} />
        </Pressable>
      </View>
      {notifications.length === 0 ? <Text style={styles.emptyText}>Nenhuma notificação.</Text> : null}
      {notifications.map((item) => (
        <Pressable key={item.id} style={[styles.notificationItem, item.read && styles.notificationItemRead]} onPress={() => onRead(item.id)}>
          <View style={[styles.activityDot, { backgroundColor: item.read ? colors.muted : notificationColor(item.tone) }]} />
          <View style={styles.notificationTextBlock}>
            <Text style={styles.notificationTitle}>{displayText(item.title)}</Text>
            <Text style={styles.notificationMessage}>{displayText(item.message)}</Text>
          </View>
          {!item.read ? <Badge tone="accent">Nova</Badge> : null}
        </Pressable>
      ))}
    </Card>
  );
}

function ProfilePanel({
  profile,
  onClose,
  onLogout,
}: {
  profile: CompanyProfile | null;
  onClose: () => void;
  onLogout: () => void;
}) {
  return (
    <Card style={styles.floatingPanel}>
      <View style={styles.panelHeader}>
        <View style={styles.cardTitleRow}>
          <Building2 color={colors.primary} size={18} />
          <Text style={styles.cardTitle}>Perfil da empresa</Text>
        </View>
        <Pressable style={styles.panelClose} onPress={onClose}>
          <X color={colors.text} size={16} />
        </Pressable>
      </View>
      <ProfileLine label="Empresa" value={profile?.companyName} />
      <ProfileLine label="Documento" value={profile?.document} />
      <ProfileLine label="E-mail" value={profile?.email} />
      <ProfileLine label="Telefone" value={profile?.phone} />
      <ProfileLine label="Endereço" value={displayText(profile?.address)} />
      <ProfileLine label="Plano" value={profile?.plan} />
      <ProfileLine label="Status" value={profile?.status} />
      <Button variant="outline" onPress={onLogout}>Sair</Button>
    </Card>
  );
}

function ProfileLine({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.profileLine}>
      <Text style={styles.profileLabel}>{label}</Text>
      <Text style={styles.profileValue}>{value || '-'}</Text>
    </View>
  );
}

function PageContent({
  activePage,
  query,
  isWide,
  dashboard,
  onNavigate,
  onComprovacaoAction,
  onEditComprovacao,
  focusedComprovacaoId,
}: {
  activePage: PageKey;
  query: string;
  isWide: boolean;
  dashboard: DashboardData;
  onNavigate: (page: PageKey) => void;
  onComprovacaoAction: (id: string, action: ComprovacaoAction, payload?: ComprovacaoActionPayload) => Promise<void>;
  onEditComprovacao: (comprovacao: Comprovacao) => void;
  focusedComprovacaoId: string;
}) {
  if (activePage === 'overview') {
    return <OverviewPage query={query} isWide={isWide} dashboard={dashboard} />;
  }
  if (activePage === 'comprovacoes') {
    return (
      <ComprovacoesPage
        query={query}
        comprovacoes={dashboard.comprovacoes}
        onAction={onComprovacaoAction}
        onEdit={onEditComprovacao}
        focusedId={focusedComprovacaoId}
      />
    );
  }
  if (activePage === 'materiais') {
    return (
      <SimpleListPage
        data={dashboard.materiais.map((item) => [item.material, item.volume, item.taxa, item.situacao])}
        title="Materiais monitorados"
        columns={['Material', 'Volume', 'Taxa', 'Situação']}
      />
    );
  }
  if (activePage === 'relatorios') {
    return (
      <SimpleListPage
        data={dashboard.relatorios.map((item) => [item.relatorio, item.formato, item.status])}
        title="Relatórios disponíveis"
        columns={['Relatório', 'Formato', 'Status']}
      />
    );
  }
  if (activePage === 'parceiros') {
    return (
      <SimpleListPage
        data={dashboard.parceiros.map((item) => [item.parceiro, item.atuacao, item.status, item.sla])}
        title="Rede de parceiros"
        columns={['Parceiro', 'Atuação', 'Status', 'SLA']}
      />
    );
  }
  if (activePage === 'certificados') {
    return (
      <SimpleListPage
        data={dashboard.certificados.map((item) => [item.id, item.material, item.status, item.data])}
        title="Certificados e laudos"
        columns={['ID', 'Material', 'Status', 'Data']}
      />
    );
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
          <StatCard key={stat.title} {...stat} title={displayText(stat.title)} description={displayText(stat.description)} />
        ))}
      </View>
      <View style={styles.gridRow}>
        <VolumeChart volumeData={dashboard.volumeData} />
        <DistributionChart materialDistribution={dashboard.materialDistribution.map((item) => ({ ...item, name: displayText(item.name) }))} />
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

function ComprovacoesPage({
  query,
  comprovacoes,
  onAction,
  onEdit,
  focusedId,
}: {
  query: string;
  comprovacoes: Comprovacao[];
  onAction: (id: string, action: ComprovacaoAction, payload?: ComprovacaoActionPayload) => Promise<void>;
  onEdit: (comprovacao: Comprovacao) => void;
  focusedId: string;
}) {
  return (
    <View style={styles.stack}>
      <Card style={styles.toolbarCard}>
        <View style={styles.toolbar}>
          <Badge tone="primary">Ciclo de Rastreabilidade Reversa</Badge>
          <Text style={styles.toolbarText}>Cadastrar → conferir → destinar → certificar → comprovar, sem pular etapas.</Text>
        </View>
      </Card>
      <ComprovacoesTable key={focusedId || 'comprovacoes'} query={query} comprovacoes={comprovacoes} onAction={onAction} onEdit={onEdit} focusedId={focusedId} />
    </View>
  );
}

function ComprovacoesTable({
  query,
  comprovacoes,
  compact = false,
  onAction,
  onEdit,
  focusedId = '',
}: {
  query: string;
  comprovacoes: Comprovacao[];
  compact?: boolean;
  onAction?: (id: string, action: ComprovacaoAction, payload?: ComprovacaoActionPayload) => Promise<void>;
  onEdit?: (comprovacao: Comprovacao) => void;
  focusedId?: string;
}) {
  const [statusFilter, setStatusFilter] = useState<ComprovacaoStatus | 'todos'>('todos');
  const [sortBy, setSortBy] = useState<ComprovacaoSort>('recentes');
  const filtered = useMemo(
    () =>
      [...comprovacoes]
        .filter((item) => {
          const text = normalizeSearch(`${item.id} ${item.material} ${item.parceiro} ${item.tipo} ${statusLabel(item.status)}`);
          const matchesText = text.includes(normalizeSearch(query));
          const matchesStatus = statusFilter === 'todos' || item.status === statusFilter;
          return matchesText && matchesStatus;
        })
        .sort((first, second) => sortComprovacoes(first, second, sortBy)),
    [comprovacoes, query, sortBy, statusFilter],
  );

  return (
    <Card style={styles.tableCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Comprovações Recentes</Text>
        <View style={styles.tableControls}>
          <SortSelect value={sortBy} onChange={setSortBy} />
          <StatusFilterSelect value={statusFilter} onChange={setStatusFilter} />
        </View>
      </View>
      <View style={styles.table}>
        {filtered.map((item) => (
          <ComprovacaoRow key={item.id} item={item} compact={compact} focused={item.id === focusedId} onAction={onAction} onEdit={onEdit} />
        ))}
        {filtered.length === 0 ? <Text style={styles.emptyText}>Nenhuma comprovação encontrada para este filtro.</Text> : null}
      </View>
    </Card>
  );
}

const statusFilterOptions: Array<{ label: string; value: ComprovacaoStatus | 'todos' }> = [
  { label: 'Todos', value: 'todos' },
  { label: 'Aguardando conferência', value: 'AGUARDANDO_CONFERENCIA' },
  { label: 'Em conferência', value: 'EM_CONFERENCIA' },
  { label: 'Conferidas', value: 'CONFERIDO' },
  { label: 'Com divergência', value: 'CONFERENCIA_COM_DIVERGENCIA' },
  { label: 'Aguardando destinação', value: 'AGUARDANDO_DESTINACAO' },
  { label: 'Destinadas', value: 'DESTINADO' },
  { label: 'Aguardando certificação', value: 'AGUARDANDO_CERTIFICACAO' },
  { label: 'Certificadas', value: 'CERTIFICADO' },
  { label: 'Relatório gerado', value: 'RELATORIO_GERADO' },
  { label: 'Rejeitadas', value: 'REJEITADO' },
];

const sortOptions: Array<{ label: string; value: ComprovacaoSort }> = [
  { label: 'Mais recentes', value: 'recentes' },
  { label: 'Mais antigas', value: 'antigas' },
  { label: 'Maior peso', value: 'maior-peso' },
  { label: 'Menor peso', value: 'menor-peso' },
  { label: 'Material A-Z', value: 'material' },
  { label: 'Parceiro A-Z', value: 'parceiro' },
];

function SortSelect({ value, onChange }: { value: ComprovacaoSort; onChange: (value: ComprovacaoSort) => void }) {
  if (Platform.OS === 'web') {
    return createElement(
      'select',
      {
        'aria-label': 'Ordenar comprovações',
        onChange: (event: unknown) => {
          const target = (event as { target: { value: ComprovacaoSort } }).target;
          onChange(target.value);
        },
        style: { ...webSelectStyle, width: 172 },
        value,
      },
      sortOptions.map((option) => createElement('option', { key: option.value, value: option.value }, option.label)),
    );
  }

  return (
    <View style={styles.selectWrap}>
      <Pressable style={styles.selectTrigger} onPress={() => onChange(nextSort(value))}>
        <Text style={styles.selectText}>{sortLabel(value)}</Text>
        <ChevronDown color={colors.text} size={15} />
      </Pressable>
    </View>
  );
}

function StatusFilterSelect({
  value,
  onChange,
}: {
  value: ComprovacaoStatus | 'todos';
  onChange: (value: ComprovacaoStatus | 'todos') => void;
}) {
  if (Platform.OS === 'web') {
    return createElement(
      'select',
      {
        'aria-label': 'Filtrar comprovações por status',
        onChange: (event: unknown) => {
          const target = (event as { target: { value: ComprovacaoStatus | 'todos' } }).target;
          onChange(target.value);
        },
        style: webSelectStyle,
        value,
      },
      statusFilterOptions.map((option) => createElement('option', { key: option.value, value: option.value }, option.label)),
    );
  }

  return (
    <View style={styles.selectWrap}>
      <Pressable style={styles.selectTrigger} onPress={() => onChange(nextStatusFilter(value))}>
        <Text style={styles.selectText}>{statusFilterLabel(value)}</Text>
        <ChevronDown color={colors.text} size={15} />
      </Pressable>
    </View>
  );
}

function sortLabel(sort: ComprovacaoSort) {
  return sortOptions.find((option) => option.value === sort)?.label ?? 'Mais recentes';
}

function nextSort(sort: ComprovacaoSort) {
  const currentIndex = sortOptions.findIndex((option) => option.value === sort);
  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % sortOptions.length : 0;
  return sortOptions[nextIndex].value;
}

function nextStatusFilter(status: ComprovacaoStatus | 'todos') {
  const currentIndex = statusFilterOptions.findIndex((option) => option.value === status);
  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % statusFilterOptions.length : 0;
  return statusFilterOptions[nextIndex].value;
}

function sortComprovacoes(first: Comprovacao, second: Comprovacao, sortBy: ComprovacaoSort) {
  if (sortBy === 'antigas') {
    return first.dataEmissao.localeCompare(second.dataEmissao);
  }

  if (sortBy === 'maior-peso') {
    return quantidadeValue(second.quantidade) - quantidadeValue(first.quantidade);
  }

  if (sortBy === 'menor-peso') {
    return quantidadeValue(first.quantidade) - quantidadeValue(second.quantidade);
  }

  if (sortBy === 'material') {
    return displayText(first.material).localeCompare(displayText(second.material), 'pt-BR');
  }

  if (sortBy === 'parceiro') {
    return first.parceiro.localeCompare(second.parceiro, 'pt-BR');
  }

  return second.dataEmissao.localeCompare(first.dataEmissao);
}

function quantidadeValue(value: string) {
  return Number(value.replace(/[^\d,-]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
}

function formatEditableQuantity(value: string) {
  const normalized = value.replace(/[^\d,.]/g, '').replace(/\./g, ',');
  const [integer = '', ...decimalParts] = normalized.split(',');
  const decimal = decimalParts.join('').slice(0, 3);
  const limitedInteger = integer.slice(0, 9);

  if (normalized.includes(',')) {
    return `${limitedInteger}${limitedInteger || decimal ? ',' : ''}${decimal}`;
  }

  return limitedInteger;
}

function statusFilterLabel(status: ComprovacaoStatus | 'todos') {
  return statusFilterOptions.find((option) => option.value === status)?.label ?? 'Todos';
}

function notificationColor(tone: string) {
  if (tone === 'success') {
    return colors.success;
  }

  if (tone === 'warning') {
    return colors.warning;
  }

  if (tone === 'danger') {
    return colors.danger;
  }

  return colors.primary;
}

function ComprovacaoRow({
  item,
  compact,
  focused,
  onAction,
  onEdit,
}: {
  item: Comprovacao;
  compact: boolean;
  focused?: boolean;
  onAction?: (id: string, action: ComprovacaoAction, payload?: ComprovacaoActionPayload) => Promise<void>;
  onEdit?: (comprovacao: Comprovacao) => void;
}) {
  const [submittingAction, setSubmittingAction] = useState<ComprovacaoAction | null>(null);
  const [pendingAction, setPendingAction] = useState<FlowAction | null>(null);
  const actions = compact ? [] : actionsForStatus(item.status);
  const lastHistoryEntry = lastComprovacaoHistory(item.observacoes);

  async function runAction(action: ComprovacaoAction, payload: ComprovacaoActionPayload) {
    if (!onAction || submittingAction) {
      return;
    }

    setSubmittingAction(action);
    try {
      await onAction(item.id, action, payload);
      setPendingAction(null);
    } finally {
      setSubmittingAction(null);
    }
  }

  return (
    <>
      <View style={[styles.tableRow, focused && styles.tableRowFocused]}>
        <View style={styles.tableMain}>
          <Text style={styles.tableId}>{item.id}</Text>
          <Text style={styles.tableSub}>{displayText(item.material)} • {displayText(item.tipo)}</Text>
          {!compact ? <Text style={styles.tableSub}>Próxima etapa: {nextStepLabel(item.status)}</Text> : null}
          {!compact && lastHistoryEntry ? (
            <Text style={styles.tableHistory} numberOfLines={2}>
              Último registro: {lastHistoryEntry}
            </Text>
          ) : null}
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
        {!compact && onAction ? (
          <View style={styles.flowActions}>
            <Text style={styles.flowActionsLabel}>Ações do ciclo</Text>
            {onEdit ? (
              <Button
                variant="outline"
                style={styles.flowActionButton}
                textStyle={styles.flowActionText}
                onPress={() => onEdit(item)}
              >
                Editar
              </Button>
            ) : null}
            {actions.map((action) => (
              <Button
                key={action.action}
                variant={action.variant}
                style={styles.flowActionButton}
                textStyle={styles.flowActionText}
                onPress={() => setPendingAction(action)}
              >
                {submittingAction === action.action ? 'Aguarde...' : action.label}
              </Button>
            ))}
          </View>
        ) : null}
      </View>
      {pendingAction ? (
        <ComprovacaoActionModal
          action={pendingAction}
          comprovacao={item}
          submitting={submittingAction === pendingAction.action}
          onClose={() => setPendingAction(null)}
          onConfirm={(payload) => runAction(pendingAction.action, payload)}
        />
      ) : null}
    </>
  );
}

function StatusBadge({ status }: { status: Comprovacao['status'] }) {
  const tone = statusTone(status);
  const color = statusColor(status);
  const done = status === 'CERTIFICADO' || status === 'RELATORIO_GERADO' || status === 'DESTINADO';
  return (
    <Badge tone={tone}>
      <View style={styles.statusContent}>
        {done ? <CheckCircle2 color={color} size={12} /> : <Clock color={color} size={12} />}
        <Text style={[styles.statusText, { color }]}>{statusLabel(status)}</Text>
      </View>
    </Badge>
  );
}

function ComprovacaoActionModal({
  action,
  comprovacao,
  submitting,
  onClose,
  onConfirm,
}: {
  action: FlowAction;
  comprovacao: Comprovacao;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (payload: ComprovacaoActionPayload) => Promise<void>;
}) {
  const config = actionConfig(action.action);
  const [responsavel, setResponsavel] = useState(comprovacao.parceiro);
  const [destino, setDestino] = useState('');
  const [documento, setDocumento] = useState('');
  const [observacoes, setObservacoes] = useState('');

  async function submit() {
    if (submitting) {
      return;
    }

    await onConfirm({
      responsavel: responsavel.trim(),
      destino: destino.trim(),
      documento: documento.trim(),
      observacoes: observacoes.trim(),
    });
  }

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Card style={styles.editModal}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.cardTitle}>{action.label}</Text>
              <Text style={styles.modalSubtitle}>{comprovacao.id} • {displayText(comprovacao.material)}</Text>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X color={colors.text} size={18} />
            </Pressable>
          </View>

          <View style={styles.editForm}>
            <Text style={styles.actionHint}>{config.hint}</Text>
            <View style={styles.editField}>
              <Text style={styles.profileLabel}>Responsável</Text>
              <Input value={responsavel} onChangeText={setResponsavel} maxLength={120} />
            </View>
            {config.destination ? (
              <View style={styles.editField}>
                <Text style={styles.profileLabel}>Destino</Text>
                <Input
                  value={destino}
                  onChangeText={setDestino}
                  maxLength={180}
                  placeholder={config.destination}
                />
              </View>
            ) : null}
            {config.document ? (
              <View style={styles.editField}>
                <Text style={styles.profileLabel}>Documento / evidência</Text>
                <Input
                  value={documento}
                  onChangeText={setDocumento}
                  maxLength={180}
                  placeholder={config.document}
                />
              </View>
            ) : null}
            <View style={styles.editField}>
              <Text style={styles.profileLabel}>Observações da etapa</Text>
              <TextInput
                multiline
                placeholder={config.observations}
                placeholderTextColor={colors.muted}
                value={observacoes}
                onChangeText={setObservacoes}
                maxLength={500}
                style={styles.editTextArea}
              />
            </View>
            <View style={styles.editActions}>
              <Button variant="outline" onPress={onClose}>Cancelar</Button>
              <Button onPress={submit}>{submitting ? 'Registrando...' : 'Confirmar etapa'}</Button>
            </View>
          </View>
        </Card>
      </View>
    </Modal>
  );
}

function EditComprovacaoModal({
  comprovacao,
  materiais,
  parceiros,
  onClose,
  onSave,
}: {
  comprovacao: Comprovacao;
  materiais: DashboardData['materiais'];
  parceiros: DashboardData['parceiros'];
  onClose: () => void;
  onSave: (id: string, payload: UpdateComprovacaoPayload) => Promise<void>;
}) {
  const materialOptions = uniqueValues(materiais.map((item) => item.material));
  const parceiroOptions = uniqueValues(parceiros.map((item) => item.parceiro));
  const [material, setMaterial] = useState(comprovacao.material || materialOptions[0] || '');
  const [quantidadeKg, setQuantidadeKg] = useState(formatEditableQuantity(comprovacao.quantidade));
  const [tipo, setTipo] = useState(comprovacao.tipo);
  const [parceiro, setParceiro] = useState(comprovacao.parceiro || parceiroOptions[0] || '');
  const [observacoes, setObservacoes] = useState(comprovacao.observacoes ?? '');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    try {
      await onSave(comprovacao.id, {
        material,
        quantidadeKg: quantidadeValue(`${quantidadeKg} kg`),
        tipo: tipo.trim(),
        parceiro,
        observacoes: observacoes.trim(),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Card style={styles.editModal}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.cardTitle}>Editar comprovação</Text>
              <Text style={styles.modalSubtitle}>{comprovacao.id} • {statusLabel(comprovacao.status)}</Text>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X color={colors.text} size={18} />
            </Pressable>
          </View>

          <View style={styles.editForm}>
            <View style={styles.editField}>
              <Text style={styles.profileLabel}>Material</Text>
              <EditOptionSelect options={materialOptions} value={material} onChange={setMaterial} />
            </View>
            <View style={styles.editField}>
              <Text style={styles.profileLabel}>Quantidade (kg)</Text>
              <Input
                value={quantidadeKg}
                onChangeText={(value) => setQuantidadeKg(formatEditableQuantity(value))}
                keyboardType="decimal-pad"
                maxLength={13}
              />
            </View>
            <View style={styles.editField}>
              <Text style={styles.profileLabel}>Tipo de operação</Text>
              <Input value={tipo} onChangeText={setTipo} maxLength={80} />
            </View>
            <View style={styles.editField}>
              <Text style={styles.profileLabel}>Parceiro responsável</Text>
              <EditOptionSelect options={parceiroOptions} value={parceiro} onChange={setParceiro} />
            </View>
            <View style={styles.editField}>
              <Text style={styles.profileLabel}>Observações e histórico</Text>
              <TextInput
                multiline
                placeholder="Informações adicionais..."
                placeholderTextColor={colors.muted}
                value={observacoes}
                onChangeText={setObservacoes}
                maxLength={500}
                style={styles.editTextArea}
              />
            </View>
            <View style={styles.editActions}>
              <Button variant="outline" onPress={onClose}>Cancelar</Button>
              <Button onPress={submit}>{submitting ? 'Salvando...' : 'Salvar alterações'}</Button>
            </View>
          </View>
        </Card>
      </View>
    </Modal>
  );
}

function EditOptionSelect({ options, value, onChange }: { options: string[]; value: string; onChange: (value: string) => void }) {
  if (!options.length) {
    return <Input value={value} onChangeText={onChange} maxLength={140} />;
  }

  return (
    <View style={styles.editOptionGroup}>
      {options.map((option) => {
        const selected = option === value;

        return (
          <Pressable
            key={option}
            style={[styles.editOption, selected && styles.editOptionSelected]}
            onPress={() => onChange(option)}
          >
            <Text style={[styles.editOptionText, selected && styles.editOptionTextSelected]} numberOfLines={1}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function uniqueValues(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

type FlowAction = {
  action: ComprovacaoAction;
  label: string;
  variant?: 'primary' | 'ghost' | 'outline';
};

function actionsForStatus(status: ComprovacaoStatus): FlowAction[] {
  const map: Record<ComprovacaoStatus, FlowAction[]> = {
    CADASTRADO: [{ action: 'INICIAR_CONFERENCIA', label: 'Iniciar conferência' }],
    AGUARDANDO_CONFERENCIA: [
      { action: 'INICIAR_CONFERENCIA', label: 'Iniciar conferência' },
      { action: 'CONFERIR', label: 'Conferir' },
      { action: 'REGISTRAR_DIVERGENCIA', label: 'Divergência', variant: 'outline' },
    ],
    EM_CONFERENCIA: [
      { action: 'CONFERIR', label: 'Conferir' },
      { action: 'REGISTRAR_DIVERGENCIA', label: 'Divergência', variant: 'outline' },
      { action: 'REJEITAR', label: 'Rejeitar', variant: 'outline' },
    ],
    CONFERIDO: [
      { action: 'LIBERAR_DESTINACAO', label: 'Liberar destinação' },
      { action: 'REGISTRAR_DIVERGENCIA', label: 'Divergência', variant: 'outline' },
    ],
    CONFERENCIA_COM_DIVERGENCIA: [
      { action: 'APROVAR_DIVERGENCIA', label: 'Aprovar' },
      { action: 'REJEITAR', label: 'Rejeitar', variant: 'outline' },
    ],
    REJEITADO: [],
    AGUARDANDO_DESTINACAO: [{ action: 'REGISTRAR_DESTINO', label: 'Registrar destino' }],
    DESTINADO: [{ action: 'SOLICITAR_CERTIFICADO', label: 'Solicitar certificado' }],
    AGUARDANDO_CERTIFICACAO: [{ action: 'CERTIFICAR', label: 'Certificar' }],
    CERTIFICADO: [{ action: 'GERAR_RELATORIO', label: 'Gerar relatório' }],
    RELATORIO_GERADO: [],
    CANCELADO: [],
  };

  return map[status] ?? [];
}

function actionConfig(action: ComprovacaoAction) {
  const configs: Record<ComprovacaoAction, {
    hint: string;
    destination?: string;
    document?: string;
    observations: string;
  }> = {
    INICIAR_CONFERENCIA: {
      hint: 'Registre quem iniciou a conferência e a primeira evidência operacional.',
      observations: 'Ex.: QR Code lido, local, condição inicial do resíduo.',
    },
    CONFERIR: {
      hint: 'Registre os dados reais usados para validar o resíduo contra o esperado.',
      document: 'Foto, ticket de pesagem ou evidência da conferência',
      observations: 'Ex.: peso real, quantidade, estado do material e fotos anexadas.',
    },
    REGISTRAR_DIVERGENCIA: {
      hint: 'Explique o que não bateu com o cadastro esperado. A divergência ficará no histórico.',
      document: 'Foto, laudo ou evidência da divergência',
      observations: 'Ex.: peso divergente, material incompatível, QR Code duplicado.',
    },
    APROVAR_DIVERGENCIA: {
      hint: 'Registre a justificativa da aprovação manual feita pelo responsável.',
      document: 'Autorização, parecer ou evidência de aprovação',
      observations: 'Ex.: divergência aceita por tolerância operacional.',
    },
    REJEITAR: {
      hint: 'Registre por que a comprovação foi rejeitada.',
      document: 'Evidência da rejeição, se houver',
      observations: 'Ex.: cooperativa não autorizada, material incorreto, ausência de evidência.',
    },
    LIBERAR_DESTINACAO: {
      hint: 'Registre a liberação para que o material siga para destinação.',
      observations: 'Ex.: conferência validada e carga liberada para transporte.',
    },
    REGISTRAR_DESTINO: {
      hint: 'Registre o destino final ou intermediário e os comprovantes de transporte.',
      destination: 'Ex.: Cooperativa homologada, indústria recicladora, coprocessamento',
      document: 'NF, manifesto, CTR, comprovante de recebimento',
      observations: 'Ex.: quantidade enviada, quantidade recebida, data e responsável.',
    },
    SOLICITAR_CERTIFICADO: {
      hint: 'Registre para quem o certificado foi solicitado e quais evidências faltam.',
      destination: 'Ex.: Cooperativa ou indústria responsável pelo certificado',
      document: 'Protocolo, pedido, e-mail ou referência interna',
      observations: 'Ex.: certificado de reciclagem solicitado após recebimento.',
    },
    CERTIFICAR: {
      hint: 'Vincule a comprovação documental que fecha a rastreabilidade do resíduo.',
      destination: 'Ex.: Destinação final comprovada',
      document: 'Certificado, laudo, NF ou comprovante de transformação',
      observations: 'Ex.: certificado recebido, período coberto e quantidade certificada.',
    },
    GERAR_RELATORIO: {
      hint: 'Registre o relatório gerado para auditoria, fiscalização ou fechamento interno.',
      document: 'Código, nome ou período do relatório',
      observations: 'Ex.: relatório comprobatório emitido para o mês de apuração.',
    },
    CANCELAR: {
      hint: 'Registre a razão do cancelamento mantendo a trilha de auditoria.',
      document: 'Evidência do cancelamento, se houver',
      observations: 'Ex.: cadastro duplicado ou operação encerrada antes da conferência.',
    },
  };

  return configs[action];
}

function lastComprovacaoHistory(value?: string | null) {
  return value?.split('\n').map((line) => line.trim()).filter(Boolean).at(-1) ?? '';
}

function statusLabel(status: ComprovacaoStatus) {
  const labels: Record<ComprovacaoStatus, string> = {
    CADASTRADO: 'Cadastrado',
    AGUARDANDO_CONFERENCIA: 'Aguardando conferência',
    EM_CONFERENCIA: 'Em conferência',
    CONFERIDO: 'Conferido',
    CONFERENCIA_COM_DIVERGENCIA: 'Com divergência',
    REJEITADO: 'Rejeitado',
    AGUARDANDO_DESTINACAO: 'Aguardando destinação',
    DESTINADO: 'Destinado',
    AGUARDANDO_CERTIFICACAO: 'Aguardando certificação',
    CERTIFICADO: 'Certificado',
    RELATORIO_GERADO: 'Relatório gerado',
    CANCELADO: 'Cancelado',
  };

  return labels[status] ?? status;
}

function nextStepLabel(status: ComprovacaoStatus) {
  const actions = actionsForStatus(status);
  return actions[0]?.label ?? 'Ciclo concluído';
}

function statusTone(status: ComprovacaoStatus): 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'muted' {
  if (status === 'CERTIFICADO' || status === 'RELATORIO_GERADO' || status === 'DESTINADO') {
    return 'success';
  }
  if (status === 'CONFERENCIA_COM_DIVERGENCIA' || status === 'AGUARDANDO_CERTIFICACAO') {
    return 'warning';
  }
  if (status === 'REJEITADO' || status === 'CANCELADO') {
    return 'danger';
  }
  if (status === 'EM_CONFERENCIA' || status === 'CONFERIDO' || status === 'AGUARDANDO_DESTINACAO') {
    return 'accent';
  }
  return 'primary';
}

function statusColor(status: ComprovacaoStatus) {
  const tone = statusTone(status);
  return tone === 'success'
    ? colors.success
    : tone === 'warning'
      ? colors.warning
      : tone === 'danger'
        ? colors.danger
        : tone === 'accent'
          ? colors.accent
          : colors.primary;
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
              <Text style={styles.metricTitle}>{displayText(metric.title)}</Text>
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
          <Text style={styles.activityText}>{displayText(activity)}</Text>
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
          <Text style={styles.cardTitle}>{displayText(title)}</Text>
          <Badge tone="primary">Atualizado</Badge>
        </View>
        <View style={styles.listHeader}>
          {columns.map((column) => (
            <Text key={column} style={styles.listHeaderText}>{displayText(column)}</Text>
          ))}
        </View>
        {data.map((row) => (
          <View key={row.join('-')} style={styles.listRow}>
            {row.map((cell, index) => (
              <Text key={cell} style={[styles.listCell, index === 0 && styles.listCellStrong]}>{displayText(cell)}</Text>
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
          <Text style={styles.cardTitle}>{displayText(item.title)}</Text>
          <Text style={styles.tableSub}>{displayText(item.description)}</Text>
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
        <Text style={styles.helpTitle}>{displayText(items[0]?.title)}</Text>
        <Text style={styles.helpText}>{displayText(items[0]?.description)}</Text>
        <Button onPress={() => items[0]?.action && onNavigate(items[0].action)}>Abrir comprovações</Button>
      </Card>
      <Card style={styles.helpCard}>
        <FileCheck color={colors.accent} size={28} />
        <Text style={styles.helpTitle}>{displayText(items[1]?.title)}</Text>
        <Text style={styles.helpText}>{displayText(items[1]?.description)}</Text>
        <Button variant="outline" onPress={() => items[1]?.action && onNavigate(items[1].action)}>Ver configurações</Button>
      </Card>
    </View>
  );
}

function pageTitleFor(dashboard: DashboardData, key: PageKey) {
  return displayText(dashboard.shell.pages.find((page) => page.key === key)?.title ?? [...navItems, ...bottomNavItems].find((item) => item.key === key)?.title ?? key);
}

const textCorrections: Record<string, string> = {
  Agua: 'Água',
  Aluminio: 'Alumínio',
  'Arvores Preservadas': 'Árvores Preservadas',
  'Acompanhe suas comprovacoes de logistica reversa.': 'Acompanhe suas comprovações de logística reversa.',
  'Campos obrigatorios': 'Campos obrigatórios',
  'Central de ajuda': 'Central de ajuda',
  'Certificados validos': 'Certificados válidos',
  'Checklist de implantacao': 'Checklist de implantação',
  Comprovacoes: 'Comprovações',
  'Comprovacoes Ativas': 'Comprovações Ativas',
  Configuracoes: 'Configurações',
  'Configuracao operacional para validar comprovacoes e certificados.': 'Configuração operacional para validar comprovações e certificados.',
  'Consulte e registre operacoes com hash de lastro.': 'Consulte e registre operações com hash de lastro.',
  'Controle volumes, categorias e eficiencia por material.': 'Controle volumes, categorias e eficiência por material.',
  'Destinacao': 'Destinação',
  'Divergencias abertas': 'Divergências abertas',
  'Em analise': 'Em análise',
  'emissoes evitadas': 'emissões evitadas',
  'Empresa, unidades, materiais, parceiros, templates e certificados iniciais.': 'Empresa, unidades, materiais, parceiros, templates e certificados iniciais.',
  'Encontre orientacoes para operar a plataforma.': 'Encontre orientações para operar a plataforma.',
  'Exporte rastreabilidade, fiscalizacao e indicadores ESG.': 'Exporte rastreabilidade, fiscalização e indicadores ESG.',
  'Guias para registrar comprovacoes, homologar parceiros, validar certificados e gerar relatorios ESG.': 'Guias para registrar comprovações, homologar parceiros, validar certificados e gerar relatórios ESG.',
  'Impacto Ambiental': 'Impacto Ambiental',
  'Logistica Reversa': 'Logística Reversa',
  'Margem de tolerancia de peso': 'Margem de tolerância de peso',
  'Materiais Rastreados': 'Materiais Rastreados',
  'Notificacoes fiscais': 'Notificações fiscais',
  Papelao: 'Papelão',
  'Pendente validacao': 'Pendente validação',
  Plastico: 'Plástico',
  'Plastico PEAD': 'Plástico PEAD',
  'Plastico PET': 'Plástico PET',
  'Regras de aprovacao': 'Regras de aprovação',
  Relatorios: 'Relatórios',
  'Relatorio ESG de maio exportado': 'Relatório ESG de maio exportado',
  'Taxa de Reciclagem': 'Taxa de Reciclagem',
  'Troia Trace': 'Troia Trace',
  'Visao Geral': 'Visão Geral',
  'Ajuste regras, tolerancias, notificacoes e permissao.': 'Ajuste regras, tolerâncias, notificações e permissão.',
  'Certificado de PlastiCycle aguardando revisao': 'Certificado de PlastiCycle aguardando revisão',
  'certificados validos': 'certificados válidos',
  'eficiencia do processo': 'eficiência do processo',
  'vs. mes anterior': 'vs. mês anterior',
};

function displayText(value?: string | null) {
  if (!value) {
    return '';
  }

  return textCorrections[value] ?? value;
}

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

const webSelectStyle = {
  appearance: 'none',
  backgroundColor: colors.cardSoft,
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23f4f6fb' stroke-width='3' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundPosition: 'right 13px center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: '14px 14px',
  border: `1px solid ${colors.text}`,
  borderRadius: 8,
  color: colors.text,
  cursor: 'pointer',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
  fontSize: 12,
  fontWeight: 900,
  height: 36,
  lineHeight: '36px',
  outline: 'none',
  padding: '0 34px 0 12px',
  width: 150,
};

const styles = StyleSheet.create({
  app: {
    backgroundColor: colors.background,
    flex: 1,
    flexDirection: 'row',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: '#000000aa',
    flex: 1,
    justifyContent: 'center',
    padding: 18,
  },
  editModal: {
    maxWidth: 620,
    width: '100%',
  },
  modalHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'space-between',
  },
  modalSubtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.cardSoft,
    borderRadius: 8,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  editForm: {
    gap: 13,
    marginTop: 16,
  },
  editField: {
    gap: 7,
  },
  editTextArea: {
    backgroundColor: colors.cardSoft,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    height: 108,
    padding: 12,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-end',
  },
  editOptionGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  editOption: {
    backgroundColor: colors.cardSoft,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: '100%',
    minHeight: 38,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  editOptionSelected: {
    backgroundColor: `${colors.primary}22`,
    borderColor: colors.primary,
  },
  editOptionText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  editOptionTextSelected: {
    color: colors.text,
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
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  tableControls: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-end',
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
  tableRowFocused: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 12,
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
  tableHistory: {
    color: colors.text,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 6,
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
  flowActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
    minWidth: 260,
  },
  flowActionsLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    width: '100%',
  },
  flowActionButton: {
    minHeight: 34,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  flowActionText: {
    fontSize: 12,
  },
  actionHint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
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
  toolbarText: {
    color: colors.muted,
    flex: 1,
    fontSize: 13,
    textAlign: 'right',
  },
  selectWrap: {
    minWidth: 148,
  },
  selectTrigger: {
    alignItems: 'center',
    backgroundColor: colors.cardSoft,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    minHeight: 34,
    paddingHorizontal: 10,
  },
  selectText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    padding: 12,
    textAlign: 'center',
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
  floatingPanel: {
    gap: 12,
    maxWidth: 420,
    position: 'absolute',
    right: 18,
    top: 78,
    width: '92%',
    zIndex: 10,
  },
  panelHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  panelClose: {
    alignItems: 'center',
    backgroundColor: colors.cardSoft,
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  notificationItem: {
    alignItems: 'flex-start',
    backgroundColor: colors.cardSoft,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  notificationItemRead: {
    opacity: 0.68,
  },
  notificationTextBlock: {
    flex: 1,
    gap: 4,
  },
  notificationTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  notificationMessage: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  profileLine: {
    borderBottomColor: `${colors.border}88`,
    borderBottomWidth: 1,
    gap: 3,
    paddingBottom: 9,
  },
  profileLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  profileValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  logoutScreen: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoutCard: {
    alignItems: 'flex-start',
    gap: 12,
    maxWidth: 380,
    width: '100%',
  },
  logoutTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  logoutText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});
