package com.hackathon.api.dashboard;

import com.hackathon.api.dashboard.DashboardData.Comprovacao;
import com.hackathon.api.dashboard.DashboardData.ComprovacaoResponse;
import com.hackathon.api.dashboard.DashboardData.CreateComprovacaoRequest;
import com.hackathon.api.dashboard.DashboardData.DistributionItem;
import com.hackathon.api.dashboard.DashboardData.HelpItem;
import com.hackathon.api.dashboard.DashboardData.ImpactMetric;
import com.hackathon.api.dashboard.DashboardData.CertificateItem;
import com.hackathon.api.dashboard.DashboardData.MaterialItem;
import com.hackathon.api.dashboard.DashboardData.AppShellData;
import com.hackathon.api.dashboard.DashboardData.PageMetadata;
import com.hackathon.api.dashboard.DashboardData.PartnerItem;
import com.hackathon.api.dashboard.DashboardData.ReportItem;
import com.hackathon.api.dashboard.DashboardData.SettingItem;
import com.hackathon.api.dashboard.DashboardData.StatItem;
import com.hackathon.api.dashboard.DashboardData.UserProfile;
import com.hackathon.api.dashboard.DashboardData.VolumeItem;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;

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
        return readOne("shell", AppShellData.class, defaultAppShell());
    }

    private AppShellData defaultAppShell() {
        return new AppShellData(
            "Troia Trace",
            "Logistica Reversa",
            "Maio 2026",
            new UserProfile("Empresa Corp", "Admin"),
            3,
            pages()
        );
    }

    List<ComprovacaoResponse> listComprovacoes(String query) {
        String normalized = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        return readList("comprovacoes", Comprovacao.class, seedComprovacoes()).stream()
            .filter(item -> normalized.isBlank() || searchable(item).contains(normalized))
            .map(this::toResponse)
            .toList();
    }

    ComprovacaoResponse createComprovacao(CreateComprovacaoRequest request) {
        int nextNumber = readList("comprovacoes", Comprovacao.class, seedComprovacoes()).stream()
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
        return filter(readList("materiais", MaterialItem.class, seedMateriais()), query, item -> "%s %s %s %s".formatted(item.material(), item.volume(), item.taxa(), item.situacao()));
    }

    List<PartnerItem> parceiros(String query) {
        return filter(readList("parceiros", PartnerItem.class, seedParceiros()), query, item -> "%s %s %s %s".formatted(item.parceiro(), item.atuacao(), item.status(), item.sla()));
    }

    List<CertificateItem> certificados(String query) {
        return filter(readList("certificados", CertificateItem.class, seedCertificados()), query, item -> "%s %s %s %s".formatted(item.id(), item.material(), item.status(), item.data()));
    }

    List<ReportItem> relatorios(String query) {
        return filter(readList("relatorios", ReportItem.class, seedRelatorios()), query, item -> "%s %s %s".formatted(item.relatorio(), item.formato(), item.status()));
    }

    List<SettingItem> configuracoes(String query) {
        return filter(readList("configuracoes", SettingItem.class, seedConfiguracoes()), query, item -> "%s %s".formatted(item.title(), item.description()));
    }

    List<HelpItem> ajuda(String query) {
        return filter(readList("ajuda", HelpItem.class, seedAjuda()), query, item -> "%s %s %s".formatted(item.title(), item.description(), item.action()));
    }

    private List<MaterialItem> seedMateriais() {
        return List.of(
            new MaterialItem("Plastico PET", "4.620 kg", "94%", "Alto volume"),
            new MaterialItem("Papelao", "3.180 kg", "91%", "Coleta recorrente"),
            new MaterialItem("Vidro", "2.410 kg", "88%", "Pendente validacao"),
            new MaterialItem("Aluminio", "1.050 kg", "96%", "Certificado"),
            new MaterialItem("Plastico PEAD", "780 kg", "72%", "Expirado")
        );
    }

    private List<PartnerItem> seedParceiros() {
        return List.of(
            new PartnerItem("RecycleTech Ltda", "Coleta e triagem", "Homologado", "98%"),
            new PartnerItem("EcoPapel S.A.", "Reciclagem de papel", "Homologado", "94%"),
            new PartnerItem("VidroVerde Ind.", "Processamento", "Pendente", "87%"),
            new PartnerItem("PlastiCycle", "Destinacao final", "Documento vencido", "76%")
        );
    }

    private List<CertificateItem> seedCertificados() {
        return List.of(
            new CertificateItem("CERT-2048", "Plastico PET", "Aprovado", "15 Mai 2026"),
            new CertificateItem("CERT-2049", "Papelao", "Aprovado", "14 Mai 2026"),
            new CertificateItem("CERT-2050", "Vidro", "Em analise", "13 Mai 2026"),
            new CertificateItem("CERT-2051", "PEAD", "Rejeitado", "08 Mai 2026")
        );
    }

    private List<ReportItem> seedRelatorios() {
        return List.of(
            new ReportItem("Rastreabilidade completa", "PDF", "Pronto"),
            new ReportItem("Volume por unidade", "Excel", "Pronto"),
            new ReportItem("Divergencias abertas", "CSV", "Gerando"),
            new ReportItem("Comprovatorio fiscal", "PDF", "Pendente")
        );
    }

    private List<SettingItem> seedConfiguracoes() {
        return List.of(
            new SettingItem("Margem de tolerancia de peso", "Configuracao operacional para validar comprovacoes e certificados.", 82),
            new SettingItem("Campos obrigatorios", "Configuracao operacional para validar comprovacoes e certificados.", 65),
            new SettingItem("Regras de aprovacao", "Configuracao operacional para validar comprovacoes e certificados.", 91),
            new SettingItem("Notificacoes fiscais", "Configuracao operacional para validar comprovacoes e certificados.", 48)
        );
    }

    private List<HelpItem> seedAjuda() {
        return List.of(
            new HelpItem("Central de ajuda", "Guias para registrar comprovacoes, homologar parceiros, validar certificados e gerar relatorios ESG.", "comprovacoes"),
            new HelpItem("Checklist de implantacao", "Empresa, unidades, materiais, parceiros, templates e certificados iniciais.", "configuracoes")
        );
    }

    private List<StatItem> stats() {
        return readList("stats", StatItem.class, List.of(
            new StatItem("Materiais Rastreados", "12.847", "kg", "+12.5%", "up", "vs. mes anterior", "primary"),
            new StatItem("Comprovacoes Ativas", "284", "", "+8.2%", "up", "certificados validos", "accent"),
            new StatItem("Taxa de Reciclagem", "94.2", "%", "+3.1%", "up", "eficiencia do processo", "success"),
            new StatItem("Impacto Ambiental", "2.4", "ton CO2", "-18.5%", "down", "emissoes evitadas", "warning")
        ));
    }

    private List<VolumeItem> volumeData() {
        return readList("volumeData", VolumeItem.class, List.of(
            new VolumeItem("Jan", 1200, 800, 600, 400),
            new VolumeItem("Fev", 1400, 900, 700, 450),
            new VolumeItem("Mar", 1100, 850, 650, 380),
            new VolumeItem("Abr", 1600, 1000, 800, 500),
            new VolumeItem("Mai", 1800, 1100, 900, 550)
        ));
    }

    private List<DistributionItem> materialDistribution() {
        return readList("materialDistribution", DistributionItem.class, List.of(
            new DistributionItem("Plastico", 35, "#f06a35"),
            new DistributionItem("Papel", 28, "#2bb6d6"),
            new DistributionItem("Vidro", 22, "#31c484"),
            new DistributionItem("Metal", 15, "#e6c75c")
        ));
    }

    private List<ImpactMetric> impactMetrics() {
        return readList("impactMetrics", ImpactMetric.class, List.of(
            new ImpactMetric("CO2 Evitado", 2.4, 5, "ton"),
            new ImpactMetric("Agua Economizada", 12500, 20000, "L"),
            new ImpactMetric("Materiais Reciclados", 12847, 15000, "kg"),
            new ImpactMetric("Arvores Preservadas", 156, 200, "un")
        ));
    }

    private List<String> activities() {
        return readList("activities", String.class, List.of(
            "COMP-001 verificada por RecycleTech",
            "Certificado de PlastiCycle aguardando revisao",
            "EcoPapel enviou novo comprovante fiscal",
            "Relatorio ESG de maio exportado"
        ));
    }

    private List<PageMetadata> pages() {
        return List.of(
            new PageMetadata("overview", "Visao Geral", "Acompanhe suas comprovacoes de logistica reversa.", "menu"),
            new PageMetadata("comprovacoes", "Comprovacoes", "Consulte e registre operacoes com hash de lastro.", "menu"),
            new PageMetadata("materiais", "Materiais", "Controle volumes, categorias e eficiencia por material.", "menu"),
            new PageMetadata("relatorios", "Relatorios", "Exporte rastreabilidade, fiscalizacao e indicadores ESG.", "menu"),
            new PageMetadata("parceiros", "Parceiros", "Acompanhe cooperativas, recicladoras e terceiros.", "menu"),
            new PageMetadata("certificados", "Certificados", "Valide laudos e certificados vinculados ao lastro.", "menu"),
            new PageMetadata("configuracoes", "Configuracoes", "Ajuste regras, tolerancias, notificacoes e permissao.", "system"),
            new PageMetadata("ajuda", "Ajuda", "Encontre orientacoes para operar a plataforma.", "system")
        );
    }

    private <T> List<T> filter(List<T> items, String query, java.util.function.Function<T, String> textExtractor) {
        String normalized = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        if (normalized.isBlank()) {
            return items;
        }
        return items.stream()
            .filter(item -> textExtractor.apply(item).toLowerCase(Locale.ROOT).contains(normalized))
            .toList();
    }

    private void seedInitialData() {
        insertSeed("shell", "app", 0, defaultAppShell());
        insertSeeds("stats", statsFallback());
        insertSeeds("comprovacoes", seedComprovacoes());
        insertSeeds("volumeData", volumeFallback());
        insertSeeds("materialDistribution", distributionFallback());
        insertSeeds("impactMetrics", impactFallback());
        insertSeeds("activities", activitiesFallback());
        insertSeeds("materiais", seedMateriais());
        insertSeeds("parceiros", seedParceiros());
        insertSeeds("certificados", seedCertificados());
        insertSeeds("relatorios", seedRelatorios());
        insertSeeds("configuracoes", seedConfiguracoes());
        insertSeeds("ajuda", seedAjuda());
    }

    private <T> void insertSeeds(String category, List<T> items) {
        for (int index = 0; index < items.size(); index++) {
            insertSeed(category, "%03d".formatted(index + 1), index + 1, items.get(index));
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

    private <T> List<T> readList(String category, Class<T> type, List<T> fallback) {
        List<String> payloads = jdbc.queryForList(
            "select payload from dashboard_seed_data where category = ? order by sort_order, item_key",
            String.class,
            category
        );
        if (payloads.isEmpty()) {
            return fallback;
        }
        return payloads.stream().map(payload -> readPayload(payload, type)).toList();
    }

    private <T> T readOne(String category, Class<T> type, T fallback) {
        List<T> items = readList(category, type, List.of(fallback));
        return items.isEmpty() ? fallback : items.getFirst();
    }

    private <T> T readPayload(String payload, Class<T> type) {
        try {
            return objectMapper.readValue(payload, type);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Nao foi possivel ler dados iniciais", exception);
        }
    }

    private int comprovacaoNumber(String id) {
        try {
            return Integer.parseInt(id.replace("COMP-", ""));
        } catch (NumberFormatException exception) {
            return 0;
        }
    }

    private List<StatItem> statsFallback() {
        return List.of(
            new StatItem("Materiais Rastreados", "12.847", "kg", "+12.5%", "up", "vs. mes anterior", "primary"),
            new StatItem("Comprovacoes Ativas", "284", "", "+8.2%", "up", "certificados validos", "accent"),
            new StatItem("Taxa de Reciclagem", "94.2", "%", "+3.1%", "up", "eficiencia do processo", "success"),
            new StatItem("Impacto Ambiental", "2.4", "ton CO2", "-18.5%", "down", "emissoes evitadas", "warning")
        );
    }

    private List<VolumeItem> volumeFallback() {
        return List.of(
            new VolumeItem("Jan", 1200, 800, 600, 400),
            new VolumeItem("Fev", 1400, 900, 700, 450),
            new VolumeItem("Mar", 1100, 850, 650, 380),
            new VolumeItem("Abr", 1600, 1000, 800, 500),
            new VolumeItem("Mai", 1800, 1100, 900, 550)
        );
    }

    private List<DistributionItem> distributionFallback() {
        return List.of(
            new DistributionItem("Plastico", 35, "#f06a35"),
            new DistributionItem("Papel", 28, "#2bb6d6"),
            new DistributionItem("Vidro", 22, "#31c484"),
            new DistributionItem("Metal", 15, "#e6c75c")
        );
    }

    private List<ImpactMetric> impactFallback() {
        return List.of(
            new ImpactMetric("CO2 Evitado", 2.4, 5, "ton"),
            new ImpactMetric("Agua Economizada", 12500, 20000, "L"),
            new ImpactMetric("Materiais Reciclados", 12847, 15000, "kg"),
            new ImpactMetric("Arvores Preservadas", 156, 200, "un")
        );
    }

    private List<String> activitiesFallback() {
        return List.of(
            "COMP-001 verificada por RecycleTech",
            "Certificado de PlastiCycle aguardando revisao",
            "EcoPapel enviou novo comprovante fiscal",
            "Relatorio ESG de maio exportado"
        );
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

    private String shortHash() {
        byte[] bytes = new byte[16];
        random.nextBytes(bytes);
        String hash = HexFormat.of().formatHex(bytes);
        return "0x%s...%s".formatted(hash.substring(0, 4), hash.substring(hash.length() - 4));
    }

    private static List<Comprovacao> seedComprovacoes() {
        return List.of(
            new Comprovacao("COMP-001", "0x7f3a...8e2d", "Plastico PET", 1250, "RecycleTech Ltda", LocalDate.of(2026, 5, 15), "verificado", "Coleta", null),
            new Comprovacao("COMP-002", "0x9c4b...1f7a", "Papelao", 890, "EcoPapel S.A.", LocalDate.of(2026, 5, 14), "verificado", "Reciclagem", null),
            new Comprovacao("COMP-003", "0x2d5e...4c8b", "Vidro", 2100, "VidroVerde Ind.", LocalDate.of(2026, 5, 13), "pendente", "Processamento", null),
            new Comprovacao("COMP-004", "0x8a1f...9d3c", "Aluminio", 450, "MetalRecicla", LocalDate.of(2026, 5, 10), "verificado", "Coleta", null),
            new Comprovacao("COMP-005", "0x5e7d...2b9f", "Plastico PEAD", 780, "PlastiCycle", LocalDate.of(2026, 5, 8), "expirado", "Destinacao", null)
        );
    }
}
