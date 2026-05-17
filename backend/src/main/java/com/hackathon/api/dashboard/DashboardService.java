package com.hackathon.api.dashboard;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathon.api.dashboard.DashboardData.AppShellData;
import com.hackathon.api.dashboard.DashboardData.CertificateItem;
import com.hackathon.api.dashboard.DashboardData.Comprovacao;
import com.hackathon.api.dashboard.DashboardData.ComprovacaoResponse;
import com.hackathon.api.dashboard.DashboardData.CreateComprovacaoRequest;
import com.hackathon.api.dashboard.DashboardData.DistributionItem;
import com.hackathon.api.dashboard.DashboardData.HelpItem;
import com.hackathon.api.dashboard.DashboardData.ImpactMetric;
import com.hackathon.api.dashboard.DashboardData.MaterialItem;
import com.hackathon.api.dashboard.DashboardData.PageMetadata;
import com.hackathon.api.dashboard.DashboardData.PartnerItem;
import com.hackathon.api.dashboard.DashboardData.ReportItem;
import com.hackathon.api.dashboard.DashboardData.SettingItem;
import com.hackathon.api.dashboard.DashboardData.StatItem;
import com.hackathon.api.dashboard.DashboardData.UserProfile;
import com.hackathon.api.dashboard.DashboardData.VolumeItem;
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

        Integer count = jdbc.queryForObject("select count(*) from dashboard_seed_data", Integer.class);
        if (count != null && count == 0) {
            seedInitialData();
        }
    }

    DashboardData dashboard() {
        return new DashboardData(
            appShell(),
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

    AppShellData appShell() {
        return readOne("shell", AppShellData.class, emptyShell());
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
            "pendente",
            request.tipo(),
            request.observacoes()
        );
        insertSeed("comprovacoes", id, -nextNumber, comprovacao);
        return toResponse(comprovacao);
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

    private void seedInitialData() {
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
            throw new IllegalStateException("Nao foi possivel carregar dados iniciais do banco", exception);
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
            throw new IllegalStateException("Nao foi possivel serializar dados iniciais", exception);
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
            throw new IllegalStateException("Nao foi possivel ler dados do banco", exception);
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

    private ComprovacaoResponse toResponse(Comprovacao comprovacao) {
        return new ComprovacaoResponse(
            comprovacao.id(),
            comprovacao.hashLastro(),
            comprovacao.material(),
            String.format(Locale.forLanguageTag("pt-BR"), "%,.0f kg", comprovacao.quantidadeKg()),
            comprovacao.parceiro(),
            DATE_FORMATTER.format(comprovacao.dataEmissao()),
            comprovacao.status(),
            comprovacao.tipo(),
            comprovacao.observacoes()
        );
    }

    private String searchable(Comprovacao item) {
        return "%s %s %s %s".formatted(item.id(), item.material(), item.parceiro(), item.tipo()).toLowerCase(Locale.ROOT);
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
}
