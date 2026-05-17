package com.hackathon.api.dashboard;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathon.api.dashboard.DashboardData.AppShellData;
import com.hackathon.api.dashboard.DashboardData.CertificateItem;
import com.hackathon.api.dashboard.DashboardData.Comprovacao;
import com.hackathon.api.dashboard.DashboardData.ComprovacaoResponse;
import com.hackathon.api.dashboard.DashboardData.CompanyProfile;
import com.hackathon.api.dashboard.DashboardData.CreateComprovacaoRequest;
import com.hackathon.api.dashboard.DashboardData.DistributionItem;
import com.hackathon.api.dashboard.DashboardData.HelpItem;
import com.hackathon.api.dashboard.DashboardData.ImpactMetric;
import com.hackathon.api.dashboard.DashboardData.LogoutResponse;
import com.hackathon.api.dashboard.DashboardData.MaterialItem;
import com.hackathon.api.dashboard.DashboardData.NotificationItem;
import com.hackathon.api.dashboard.DashboardData.PageMetadata;
import com.hackathon.api.dashboard.DashboardData.PartnerItem;
import com.hackathon.api.dashboard.DashboardData.ReportItem;
import com.hackathon.api.dashboard.DashboardData.SettingItem;
import com.hackathon.api.dashboard.DashboardData.StatItem;
import com.hackathon.api.dashboard.DashboardData.UserProfile;
import com.hackathon.api.dashboard.DashboardData.VolumeItem;
import com.hackathon.api.user.User;
import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.function.Function;

@Service
public class DashboardService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.forLanguageTag("pt-BR"));

    private final SecureRandom random = new SecureRandom();
    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;

    DashboardService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
        this.objectMapper = new ObjectMapper().findAndRegisterModules();
    }

    @PostConstruct
    void initializeDatabase() {
        jdbc.execute("""
            create table if not exists dashboard_seed_data (
                category varchar(80) not null,
                item_key varchar(120) not null,
                sort_order integer not null,
                payload text not null,
                primary key (category, item_key)
            )
            """);

        refreshStaticSeedData();
    }

    DashboardData dashboard(User user) {
        return new DashboardData(
            appShell(user),
            stats(),
            listComprovacoes(null),
            volumeData(),
            materialDistribution(),
            impactMetrics(),
            activities(),
            materiais(null),
            parceiros(null),
            certificados(null),
            relatorios(null),
            configuracoes(null),
            ajuda(null)
        );
    }

    AppShellData appShell(User user) {
        AppShellData shell = readOne("shell", AppShellData.class, emptyShell());
        return new AppShellData(
            shell.brandName(),
            shell.brandSubtitle(),
            shell.period(),
            new UserProfile(user.getName(), "Empresa"),
            unreadNotificationsCount(),
            shell.pages()
        );
    }

    CompanyProfile companyProfile(User user) {
        return new CompanyProfile(
            user.getName(),
            user.getDocument(),
            user.getEmail(),
            user.getPhone(),
            user.getAddress(),
            user.getPlan(),
            "Ativo"
        );
    }

    List<NotificationItem> notifications() {
        return readList("notifications", NotificationItem.class);
    }

    NotificationItem markNotificationRead(String id) {
        NotificationItem notification = notifications().stream()
            .filter(item -> item.id().equals(id))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Notificacao nao encontrada"));
        NotificationItem updated = new NotificationItem(
            notification.id(),
            notification.title(),
            notification.message(),
            notification.createdAt(),
            true,
            notification.tone()
        );
        updateSeed("notifications", id, updated);
        return updated;
    }

    LogoutResponse logout() {
        return new LogoutResponse(true, "Sessao encerrada");
    }

    List<ComprovacaoResponse> listComprovacoes(String query) {
        String normalized = normalize(query);
        return readList("comprovacoes", Comprovacao.class).stream()
            .filter(item -> normalized.isBlank() || searchable(item).contains(normalized))
            .map(this::toResponse)
            .toList();
    }

    ComprovacaoResponse createComprovacao(CreateComprovacaoRequest request) {
        int nextNumber = readList("comprovacoes", Comprovacao.class).stream()
            .map(Comprovacao::id)
            .mapToInt(this::comprovacaoNumber)
            .max()
            .orElse(0) + 1;
        String id = "COMP-%03d".formatted(nextNumber);
        Comprovacao comprovacao = new Comprovacao(
            id,
            shortHash(),
            request.material(),
            request.quantidadeKg(),
            request.parceiro(),
            LocalDate.now(),
            "AGUARDANDO_CONFERENCIA",
            request.tipo(),
            request.observacoes()
        );
        insertSeed("comprovacoes", id, -nextNumber, comprovacao);
        return toResponse(comprovacao);
    }

    ComprovacaoResponse updateComprovacao(String id, DashboardData.UpdateComprovacaoRequest request) {
        StoredComprovacao stored = readStoredComprovacoes().stream()
            .filter(item -> item.comprovacao().id().equals(id))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Comprovacao nao encontrada"));

        Comprovacao updated = new Comprovacao(
            stored.comprovacao().id(),
            stored.comprovacao().hashLastro(),
            request.material(),
            request.quantidadeKg(),
            request.parceiro(),
            stored.comprovacao().dataEmissao(),
            normalizeStatus(stored.comprovacao().status()),
            request.tipo(),
            appendHistory(request.observacoes(), "DADOS_EDITADOS")
        );
        updateSeed("comprovacoes", stored.itemKey(), updated);
        return toResponse(updated);
    }

    ComprovacaoResponse updateComprovacaoStatus(String id, DashboardData.UpdateComprovacaoStatusRequest request) {
        StoredComprovacao stored = readStoredComprovacoes().stream()
            .filter(item -> item.comprovacao().id().equals(id))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Comprovacao nao encontrada"));

        String nextStatus = nextStatusFor(normalizeStatus(stored.comprovacao().status()), request.action());
        Comprovacao updated = new Comprovacao(
            stored.comprovacao().id(),
            stored.comprovacao().hashLastro(),
            stored.comprovacao().material(),
            stored.comprovacao().quantidadeKg(),
            stored.comprovacao().parceiro(),
            stored.comprovacao().dataEmissao(),
            nextStatus,
            stored.comprovacao().tipo(),
            appendActionHistory(stored.comprovacao().observacoes(), nextStatus, request)
        );
        updateSeed("comprovacoes", stored.itemKey(), updated);
        return toResponse(updated);
    }

    List<MaterialItem> materiais(String query) {
        return filter(readList("materiais", MaterialItem.class), query, item -> "%s %s %s %s".formatted(item.material(), item.volume(), item.taxa(), item.situacao()));
    }

    List<PartnerItem> parceiros(String query) {
        return filter(readList("parceiros", PartnerItem.class), query, item -> "%s %s %s %s".formatted(item.parceiro(), item.atuacao(), item.status(), item.sla()));
    }

    List<CertificateItem> certificados(String query) {
        return filter(readList("certificados", CertificateItem.class), query, item -> "%s %s %s %s".formatted(item.id(), item.material(), item.status(), item.data()));
    }

    List<ReportItem> relatorios(String query) {
        return filter(readList("relatorios", ReportItem.class), query, item -> "%s %s %s".formatted(item.relatorio(), item.formato(), item.status()));
    }

    List<SettingItem> configuracoes(String query) {
        return filter(readList("configuracoes", SettingItem.class), query, item -> "%s %s".formatted(item.title(), item.description()));
    }

    List<HelpItem> ajuda(String query) {
        return filter(readList("ajuda", HelpItem.class), query, item -> "%s %s %s".formatted(item.title(), item.description(), item.action()));
    }

    private List<StatItem> stats() {
        return readList("stats", StatItem.class);
    }

    private List<VolumeItem> volumeData() {
        return readList("volumeData", VolumeItem.class);
    }

    private List<DistributionItem> materialDistribution() {
        return readList("materialDistribution", DistributionItem.class);
    }

    private List<ImpactMetric> impactMetrics() {
        return readList("impactMetrics", ImpactMetric.class);
    }

    private List<String> activities() {
        return readList("activities", String.class);
    }

    private void refreshStaticSeedData() {
        jdbc.update("delete from dashboard_seed_data where category <> 'comprovacoes'");
        jdbc.update("delete from dashboard_seed_data where category = 'comprovacoes' and item_key not like 'COMP-%'");

        JsonNode root = readSeedFile();
        root.fields().forEachRemaining(entry -> {
            String category = entry.getKey();
            JsonNode value = entry.getValue();

            if (value.isArray()) {
                int index = 1;
                for (JsonNode item : value) {
                    insertSeed(category, "%03d".formatted(index), index, item);
                    index++;
                }
                return;
            }

            insertSeed(category, "app", 0, value);
        });
    }

    private JsonNode readSeedFile() {
        try {
            return objectMapper.readTree(new ClassPathResource("db/seed/dashboard-seed.json").getInputStream());
        } catch (IOException exception) {
            throw new IllegalStateException("Não foi possível carregar dados iniciais do banco", exception);
        }
    }

    private void insertSeed(String category, String itemKey, int sortOrder, Object payload) {
        try {
            jdbc.update(
                "insert into dashboard_seed_data (category, item_key, sort_order, payload) values (?, ?, ?, ?)",
                category,
                itemKey,
                sortOrder,
                objectMapper.writeValueAsString(payload)
            );
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Não foi possível serializar dados iniciais", exception);
        }
    }

    private void updateSeed(String category, String itemKey, Object payload) {
        try {
            jdbc.update(
                "update dashboard_seed_data set payload = ? where category = ? and item_key = ?",
                objectMapper.writeValueAsString(payload),
                category,
                itemKey
            );
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Nao foi possivel atualizar dados do banco", exception);
        }
    }

    private <T> List<T> readList(String category, Class<T> type) {
        List<String> payloads = jdbc.queryForList(
            "select payload from dashboard_seed_data where category = ? order by sort_order, item_key",
            String.class,
            category
        );
        return payloads.stream().map(payload -> readPayload(payload, type)).toList();
    }

    private <T> T readOne(String category, Class<T> type, T fallback) {
        List<T> items = readList(category, type);
        return items.isEmpty() ? fallback : items.getFirst();
    }

    private <T> T readPayload(String payload, Class<T> type) {
        try {
            return objectMapper.readValue(payload, type);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Não foi possível ler dados do banco", exception);
        }
    }

    private <T> List<T> filter(List<T> items, String query, Function<T, String> textExtractor) {
        String normalized = normalize(query);
        if (normalized.isBlank()) {
            return items;
        }
        return items.stream()
            .filter(item -> textExtractor.apply(item).toLowerCase(Locale.ROOT).contains(normalized))
            .toList();
    }

    private String normalize(String query) {
        return query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
    }

    private AppShellData emptyShell() {
        return new AppShellData("", "", "", new UserProfile("", ""), 0, List.<PageMetadata>of());
    }

    private CompanyProfile emptyCompanyProfile() {
        return new CompanyProfile("", "", "", "", "", "", "");
    }

    private int unreadNotificationsCount() {
        return (int) notifications().stream().filter(item -> !item.read()).count();
    }

    private ComprovacaoResponse toResponse(Comprovacao comprovacao) {
        return new ComprovacaoResponse(
            comprovacao.id(),
            comprovacao.hashLastro(),
            comprovacao.material(),
            String.format(Locale.forLanguageTag("pt-BR"), "%,.0f kg", comprovacao.quantidadeKg()),
            comprovacao.parceiro(),
            DATE_FORMATTER.format(comprovacao.dataEmissao()),
            normalizeStatus(comprovacao.status()),
            comprovacao.tipo(),
            comprovacao.observacoes()
        );
    }

    private String searchable(Comprovacao item) {
        return "%s %s %s %s %s".formatted(item.id(), item.material(), item.parceiro(), item.tipo(), normalizeStatus(item.status())).toLowerCase(Locale.ROOT);
    }

    private List<StoredComprovacao> readStoredComprovacoes() {
        return jdbc.query(
            "select item_key, payload from dashboard_seed_data where category = ? order by sort_order, item_key",
            (resultSet, rowNumber) -> new StoredComprovacao(
                resultSet.getString("item_key"),
                readPayload(resultSet.getString("payload"), Comprovacao.class)
            ),
            "comprovacoes"
        );
    }

    private String nextStatusFor(String status, String action) {
        String normalizedAction = action == null ? "" : action.trim().toUpperCase(Locale.ROOT);
        return switch (normalizedAction) {
            case "INICIAR_CONFERENCIA" -> requireStatus(status, "AGUARDANDO_CONFERENCIA", "EM_CONFERENCIA");
            case "CONFERIR" -> requireOneOf(status, List.of("AGUARDANDO_CONFERENCIA", "EM_CONFERENCIA"), "CONFERIDO");
            case "REGISTRAR_DIVERGENCIA" -> requireOneOf(status, List.of("AGUARDANDO_CONFERENCIA", "EM_CONFERENCIA", "CONFERIDO"), "CONFERENCIA_COM_DIVERGENCIA");
            case "APROVAR_DIVERGENCIA" -> requireStatus(status, "CONFERENCIA_COM_DIVERGENCIA", "CONFERIDO");
            case "REJEITAR" -> requireOneOf(status, List.of("AGUARDANDO_CONFERENCIA", "EM_CONFERENCIA", "CONFERENCIA_COM_DIVERGENCIA"), "REJEITADO");
            case "LIBERAR_DESTINACAO" -> requireStatus(status, "CONFERIDO", "AGUARDANDO_DESTINACAO");
            case "REGISTRAR_DESTINO" -> requireStatus(status, "AGUARDANDO_DESTINACAO", "DESTINADO");
            case "SOLICITAR_CERTIFICADO" -> requireStatus(status, "DESTINADO", "AGUARDANDO_CERTIFICACAO");
            case "CERTIFICAR" -> requireStatus(status, "AGUARDANDO_CERTIFICACAO", "CERTIFICADO");
            case "GERAR_RELATORIO" -> requireStatus(status, "CERTIFICADO", "RELATORIO_GERADO");
            case "CANCELAR" -> requireOneOf(status, List.of("AGUARDANDO_CONFERENCIA", "EM_CONFERENCIA", "CONFERENCIA_COM_DIVERGENCIA"), "CANCELADO");
            default -> throw new IllegalArgumentException("Acao de comprovacao invalida");
        };
    }

    private String requireStatus(String current, String expected, String next) {
        if (!current.equals(expected)) {
            throw new IllegalArgumentException("Transicao de status invalida");
        }
        return next;
    }

    private String requireOneOf(String current, List<String> expected, String next) {
        if (!expected.contains(current)) {
            throw new IllegalArgumentException("Transicao de status invalida");
        }
        return next;
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return "AGUARDANDO_CONFERENCIA";
        }

        return switch (status.trim().toUpperCase(Locale.ROOT)) {
            case "PENDENTE" -> "AGUARDANDO_CONFERENCIA";
            case "VERIFICADO" -> "CERTIFICADO";
            case "EXPIRADO" -> "REJEITADO";
            default -> status.trim().toUpperCase(Locale.ROOT);
        };
    }

    private String appendHistory(String observacoes, String status) {
        String entry = "Status atualizado para %s em %s".formatted(status, LocalDate.now());
        if (observacoes == null || observacoes.isBlank()) {
            return entry;
        }
        return "%s\n%s".formatted(observacoes, entry);
    }

    private String appendActionHistory(String observacoes, String status, DashboardData.UpdateComprovacaoStatusRequest request) {
        StringBuilder entry = new StringBuilder("Status atualizado para %s em %s".formatted(status, LocalDate.now()));
        appendDetail(entry, "Responsavel", request.responsavel());
        appendDetail(entry, "Destino", request.destino());
        appendDetail(entry, "Documento", request.documento());
        appendDetail(entry, "Observacoes", request.observacoes());

        if (observacoes == null || observacoes.isBlank()) {
            return entry.toString();
        }
        return "%s\n%s".formatted(observacoes, entry);
    }

    private void appendDetail(StringBuilder entry, String label, String value) {
        if (value != null && !value.isBlank()) {
            entry.append(" | ").append(label).append(": ").append(value.trim());
        }
    }

    private int comprovacaoNumber(String id) {
        try {
            return Integer.parseInt(id.replace("COMP-", ""));
        } catch (NumberFormatException exception) {
            return 0;
        }
    }

    private String shortHash() {
        byte[] bytes = new byte[16];
        random.nextBytes(bytes);
        String hash = HexFormat.of().formatHex(bytes);
        return "0x%s...%s".formatted(hash.substring(0, 4), hash.substring(hash.length() - 4));
    }

    private record StoredComprovacao(String itemKey, Comprovacao comprovacao) {
    }
}
