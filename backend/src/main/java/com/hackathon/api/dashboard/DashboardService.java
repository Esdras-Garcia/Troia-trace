package com.hackathon.api.dashboard;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathon.api.dashboard.DashboardData.AppShellData;
import com.hackathon.api.dashboard.DashboardData.CertificateItem;
import com.hackathon.api.dashboard.DashboardData.CertificateRequest;
import com.hackathon.api.dashboard.DashboardData.Comprovacao;
import com.hackathon.api.dashboard.DashboardData.ComprovacaoResponse;
import com.hackathon.api.dashboard.DashboardData.CompanyProfile;
import com.hackathon.api.dashboard.DashboardData.CreateComprovacaoRequest;
import com.hackathon.api.dashboard.DashboardData.CreateMaterialRequest;
import com.hackathon.api.dashboard.DashboardData.DistributionItem;
import com.hackathon.api.dashboard.DashboardData.EvidenceRequest;
import com.hackathon.api.dashboard.DashboardData.GenerateReportRequest;
import com.hackathon.api.dashboard.DashboardData.HelpItem;
import com.hackathon.api.dashboard.DashboardData.ImpactMetric;
import com.hackathon.api.dashboard.DashboardData.LogoutResponse;
import com.hackathon.api.dashboard.DashboardData.MaterialItem;
import com.hackathon.api.dashboard.DashboardData.MobileBootstrap;
import com.hackathon.api.dashboard.DashboardData.MobileMe;
import com.hackathon.api.dashboard.DashboardData.NotificationItem;
import com.hackathon.api.dashboard.DashboardData.PageMetadata;
import com.hackathon.api.dashboard.DashboardData.PartnerItem;
import com.hackathon.api.dashboard.DashboardData.PartnerRequest;
import com.hackathon.api.dashboard.DashboardData.ReportItem;
import com.hackathon.api.dashboard.DashboardData.SettingItem;
import com.hackathon.api.dashboard.DashboardData.StatItem;
import com.hackathon.api.dashboard.DashboardData.UpdateMaterialRequest;
import com.hackathon.api.dashboard.DashboardData.UserProfile;
import com.hackathon.api.dashboard.DashboardData.VolumeItem;
import com.hackathon.api.user.User;
import com.lowagie.text.Document;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import jakarta.annotation.PostConstruct;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
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

    MobileMe mobileMe(User user) {
        return new MobileMe(
            new UserProfile(user.getName(), "Operador mobile"),
            companyProfile(user),
            List.of(
                "LER_QR_CODE",
                "CONFERIR_RESIDUO",
                "REGISTRAR_EVIDENCIA",
                "REGISTRAR_COLETA",
                "REGISTRAR_DESTINACAO",
                "ENVIAR_CERTIFICADO",
                "SINCRONIZAR_OFFLINE"
            )
        );
    }

    MobileBootstrap mobileBootstrap(User user) {
        return new MobileBootstrap(
            mobileMe(user),
            listComprovacoes(null),
            materiais(null),
            parceiros(null),
            certificados(null)
        );
    }

    ComprovacaoResponse mobileFindByCode(String code) {
        String normalized = normalize(code);
        return listComprovacoes(null).stream()
            .filter(item -> normalize(item.id()).equals(normalized) || normalize(item.hashLastro()).equals(normalized))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Codigo mobile nao encontrado"));
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
            request.observacoes(),
            request.evidenciaNome(),
            request.evidenciaTipo(),
            request.evidenciaConteudo()
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
            appendHistory(request.observacoes(), "DADOS_EDITADOS"),
            stored.comprovacao().evidenciaNome(),
            stored.comprovacao().evidenciaTipo(),
            stored.comprovacao().evidenciaConteudo()
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
            appendActionHistory(stored.comprovacao().observacoes(), nextStatus, request),
            firstNonBlank(request.evidenciaNome(), stored.comprovacao().evidenciaNome()),
            firstNonBlank(request.evidenciaTipo(), stored.comprovacao().evidenciaTipo()),
            firstNonBlank(request.evidenciaConteudo(), stored.comprovacao().evidenciaConteudo())
        );
        updateSeed("comprovacoes", stored.itemKey(), updated);
        return toResponse(updated);
    }

    ComprovacaoResponse attachEvidence(String id, EvidenceRequest request) {
        StoredComprovacao stored = readStoredComprovacoes().stream()
            .filter(item -> item.comprovacao().id().equals(id))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Comprovacao nao encontrada"));

        Comprovacao current = stored.comprovacao();
        Comprovacao updated = new Comprovacao(
            current.id(),
            current.hashLastro(),
            current.material(),
            current.quantidadeKg(),
            current.parceiro(),
            current.dataEmissao(),
            normalizeStatus(current.status()),
            current.tipo(),
            appendHistory(firstNonBlank(request.observacoes(), current.observacoes()), "EVIDENCIA_ANEXADA"),
            firstNonBlank(request.evidenciaNome(), current.evidenciaNome()),
            firstNonBlank(request.evidenciaTipo(), current.evidenciaTipo()),
            firstNonBlank(request.evidenciaConteudo(), current.evidenciaConteudo())
        );
        updateSeed("comprovacoes", stored.itemKey(), updated);
        return toResponse(updated);
    }

    List<MaterialItem> materiais(String query) {
        return filter(readStoredMaterials().stream().map(this::materialWithId).toList(), query, item -> "%s %s %s %s".formatted(item.material(), item.volume(), item.taxa(), item.situacao()));
    }

    MaterialItem createMaterial(CreateMaterialRequest request) {
        String id = nextMaterialId();
        MaterialItem material = new MaterialItem(
            id,
            request.material().trim(),
            request.volume().trim(),
            request.taxa().trim(),
            request.situacao().trim()
        );
        insertSeed("materiais", id, nextMaterialSortOrder(), material);
        return material;
    }

    MaterialItem updateMaterial(String id, UpdateMaterialRequest request) {
        StoredMaterial stored = findStoredMaterial(id)
            .orElseThrow(() -> new IllegalArgumentException("Material nao encontrado"));

        MaterialItem updated = new MaterialItem(
            materialWithId(stored).id(),
            request.material().trim(),
            request.volume().trim(),
            request.taxa().trim(),
            request.situacao().trim()
        );
        updateSeed("materiais", stored.itemKey(), updated);
        return updated;
    }

    MaterialItem deleteMaterial(String id) {
        StoredMaterial stored = findStoredMaterial(id)
            .orElseThrow(() -> new IllegalArgumentException("Material nao encontrado"));
        deleteSeed("materiais", stored.itemKey());
        return materialWithId(stored);
    }

    List<PartnerItem> parceiros(String query) {
        return filter(readList("parceiros", PartnerItem.class), query, item -> "%s %s %s %s".formatted(item.parceiro(), item.atuacao(), item.status(), item.sla()));
    }

    PartnerItem createParceiro(PartnerRequest request) {
        if (findStoredParceiro(request.parceiro()).isPresent()) {
            throw new IllegalArgumentException("Parceiro ja cadastrado");
        }

        PartnerItem parceiro = toPartnerItem(request);
        insertSeed("parceiros", partnerKey(parceiro.parceiro()), nextPartnerSortOrder(), parceiro);
        return parceiro;
    }

    PartnerItem updateParceiro(String parceiro, PartnerRequest request) {
        StoredPartner stored = findStoredParceiro(parceiro)
            .orElseThrow(() -> new IllegalArgumentException("Parceiro nao encontrado"));
        String nextKey = partnerKey(request.parceiro());

        boolean nameChanged = !stored.partner().parceiro().equalsIgnoreCase(request.parceiro().trim());
        if (nameChanged && findStoredParceiro(request.parceiro()).isPresent()) {
            throw new IllegalArgumentException("Parceiro ja cadastrado");
        }

        PartnerItem updated = toPartnerItem(request);
        if (stored.itemKey().equals(nextKey)) {
            updateSeed("parceiros", stored.itemKey(), updated);
        } else {
            deleteSeed("parceiros", stored.itemKey());
            insertSeed("parceiros", nextKey, stored.sortOrder(), updated);
        }
        return updated;
    }

    PartnerItem deleteParceiro(String parceiro) {
        StoredPartner stored = findStoredParceiro(parceiro)
            .orElseThrow(() -> new IllegalArgumentException("Parceiro nao encontrado"));
        deleteSeed("parceiros", stored.itemKey());
        return stored.partner();
    }

    List<CertificateItem> certificados(String query) {
        return filter(readList("certificados", CertificateItem.class), query, item -> "%s %s %s %s".formatted(item.id(), item.material(), item.status(), item.data()));
    }

    CertificateItem createCertificado(CertificateRequest request) {
        if (findStoredCertificate(request.id()).isPresent()) {
            throw new IllegalArgumentException("Certificado ja cadastrado");
        }

        CertificateItem certificado = toCertificateItem(request);
        insertSeed("certificados", certificado.id(), nextCertificateSortOrder(), certificado);
        return certificado;
    }

    CertificateItem updateCertificado(String id, CertificateRequest request) {
        StoredCertificate stored = findStoredCertificate(id)
            .orElseThrow(() -> new IllegalArgumentException("Certificado nao encontrado"));
        String nextKey = request.id().trim();

        boolean idChanged = !stored.certificate().id().equalsIgnoreCase(nextKey);
        if (idChanged && findStoredCertificate(nextKey).isPresent()) {
            throw new IllegalArgumentException("Certificado ja cadastrado");
        }

        CertificateItem updated = toCertificateItem(request);
        if (stored.itemKey().equals(nextKey)) {
            updateSeed("certificados", stored.itemKey(), updated);
        } else {
            deleteSeed("certificados", stored.itemKey());
            insertSeed("certificados", nextKey, stored.sortOrder(), updated);
        }
        return updated;
    }

    CertificateItem deleteCertificado(String id) {
        StoredCertificate stored = findStoredCertificate(id)
            .orElseThrow(() -> new IllegalArgumentException("Certificado nao encontrado"));
        deleteSeed("certificados", stored.itemKey());
        return stored.certificate();
    }

    List<ReportItem> relatorios(String query) {
        return filter(readList("relatorios", ReportItem.class), query, item -> "%s %s %s".formatted(item.relatorio(), item.formato(), item.status()));
    }

    ReportItem generateReport(GenerateReportRequest request) {
        String formato = normalizeReportFormat(request.formato());
        String extension = formato.equals("PDF") ? "pdf" : "xlsx";
        String fileName = "Relatorio_%s_%s.%s".formatted(
            normalizeFilePart(request.tipo()),
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")),
            extension
        );
        GenerateReportRequest normalizedRequest = new GenerateReportRequest(
            request.tipo(),
            formato,
            request.periodoInicio(),
            request.periodoFim(),
            request.materiais()
        );
        ReportItem report = new ReportItem(fileName, formato.equals("PDF") ? "PDF" : "Excel", "Disponível");
        insertSeed("relatorios", fileName, -1, report);
        insertSeed("reportRequests", fileName, -1, normalizedRequest);
        return report;
    }

    public byte[] exportReport(String fileName) {
        GenerateReportRequest request = readReportRequest(fileName);
        List<Comprovacao> data = filterReportData(readList("comprovacoes", Comprovacao.class), request);
        
        if (fileName.endsWith(".pdf")) {
            return generatePdf(fileName, data);
        } else {
            return generateExcel(data);
        }
    }

    private byte[] generatePdf(String title, List<Comprovacao> data) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document();
            PdfWriter.getInstance(document, out);
            document.open();
            document.add(new Paragraph("TROIA TRACE - RELATORIO DE RASTREABILIDADE"));
            document.add(new Paragraph("Arquivo: " + title));
            document.add(new Paragraph("Data de geracao: " + LocalDate.now()));
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(5);
            table.addCell("ID");
            table.addCell("Material");
            table.addCell("Qtd (kg)");
            table.addCell("Parceiro");
            table.addCell("Status");

            for (Comprovacao c : data) {
                table.addCell(c.id());
                table.addCell(c.material());
                table.addCell(String.valueOf(c.quantidadeKg()));
                table.addCell(c.parceiro());
                table.addCell(c.status());
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            return "Erro ao gerar PDF".getBytes(StandardCharsets.UTF_8);
        }
    }

    private byte[] generateExcel(List<Comprovacao> data) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Relatorio");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("ID");
            header.createCell(1).setCellValue("Material");
            header.createCell(2).setCellValue("Quantidade (kg)");
            header.createCell(3).setCellValue("Parceiro");
            header.createCell(4).setCellValue("Status");
            header.createCell(5).setCellValue("Data");
            header.createCell(6).setCellValue("Hash");

            int rowIdx = 1;
            for (Comprovacao c : data) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(c.id());
                row.createCell(1).setCellValue(c.material());
                row.createCell(2).setCellValue(c.quantidadeKg());
                row.createCell(3).setCellValue(c.parceiro());
                row.createCell(4).setCellValue(c.status());
                row.createCell(5).setCellValue(c.dataEmissao().toString());
                row.createCell(6).setCellValue(c.hashLastro());
            }

            for (int index = 0; index <= 6; index++) {
                sheet.autoSizeColumn(index);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            return "Erro ao gerar Excel".getBytes(StandardCharsets.UTF_8);
        }
    }

    private String normalizeReportFormat(String formato) {
        String normalized = normalize(formato);
        if (normalized.equals("pdf")) {
            return "PDF";
        }
        if (normalized.equals("excel") || normalized.equals("xlsx")) {
            return "XLSX";
        }
        throw new IllegalArgumentException("Formato de relatorio invalido");
    }

    private String normalizeFilePart(String value) {
        return normalize(value).replaceAll("[^a-z0-9]+", "_").replaceAll("(^_|_$)", "");
    }

    private GenerateReportRequest readReportRequest(String fileName) {
        return jdbc.queryForList(
                "select payload from dashboard_seed_data where category = ? and item_key = ?",
                String.class,
                "reportRequests",
                fileName
            )
            .stream()
            .findFirst()
            .map(payload -> readPayload(payload, GenerateReportRequest.class))
            .orElse(new GenerateReportRequest("Relatorio operacional", fileName.endsWith(".pdf") ? "PDF" : "XLSX", "1900-01-01", "2999-12-31", List.of()));
    }

    private List<Comprovacao> filterReportData(List<Comprovacao> data, GenerateReportRequest request) {
        LocalDate start = LocalDate.parse(request.periodoInicio());
        LocalDate end = LocalDate.parse(request.periodoFim());
        List<String> materiais = request.materiais() == null ? List.of() : request.materiais();

        return data.stream()
            .filter(item -> !item.dataEmissao().isBefore(start) && !item.dataEmissao().isAfter(end))
            .filter(item -> materiais.isEmpty() || materiais.contains(item.material()))
            .toList();
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
        jdbc.update("delete from dashboard_seed_data where category <> 'comprovacoes' and category <> 'relatorios' and category <> 'reportRequests' and category <> 'parceiros' and category <> 'materiais' and category <> 'certificados'");
        jdbc.update("delete from dashboard_seed_data where category = 'comprovacoes' and item_key not like 'COMP-%'");

        JsonNode root = readSeedFile();
        root.fields().forEachRemaining(entry -> {
            String category = entry.getKey();
            JsonNode value = entry.getValue();

            if (category.equals("relatorios") && !readList("relatorios", ReportItem.class).isEmpty()) {
                return;
            }

            if (category.equals("parceiros") && !readList("parceiros", PartnerItem.class).isEmpty()) {
                return;
            }

            if (category.equals("materiais") && !readList("materiais", MaterialItem.class).isEmpty()) {
                return;
            }

            if (category.equals("certificados") && !readList("certificados", CertificateItem.class).isEmpty()) {
                return;
            }

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

    private void deleteSeed(String category, String itemKey) {
        jdbc.update("delete from dashboard_seed_data where category = ? and item_key = ?", category, itemKey);
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
            comprovacao.observacoes(),
            comprovacao.evidenciaNome(),
            comprovacao.evidenciaTipo(),
            comprovacao.evidenciaConteudo()
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

    private String firstNonBlank(String first, String fallback) {
        return first == null || first.isBlank() ? fallback : first.trim();
    }

    private CertificateItem toCertificateItem(CertificateRequest request) {
        return new CertificateItem(
            request.id().trim(),
            request.material().trim(),
            request.status().trim(),
            request.data().trim()
        );
    }

    private java.util.Optional<StoredCertificate> findStoredCertificate(String id) {
        String normalized = normalize(id);
        return readStoredCertificates().stream()
            .filter(item -> normalize(item.itemKey()).equals(normalized) || normalize(item.certificate().id()).equals(normalized))
            .findFirst();
    }

    private List<StoredCertificate> readStoredCertificates() {
        return jdbc.query(
            "select item_key, sort_order, payload from dashboard_seed_data where category = ? order by sort_order, item_key",
            (resultSet, rowNumber) -> new StoredCertificate(
                resultSet.getString("item_key"),
                resultSet.getInt("sort_order"),
                readPayload(resultSet.getString("payload"), CertificateItem.class)
            ),
            "certificados"
        );
    }

    private int nextCertificateSortOrder() {
        return readStoredCertificates().stream()
            .mapToInt(StoredCertificate::sortOrder)
            .max()
            .orElse(0) + 1;
    }

    private PartnerItem toPartnerItem(PartnerRequest request) {
        return new PartnerItem(
            request.parceiro().trim(),
            request.atuacao().trim(),
            request.status().trim(),
            request.sla().trim()
        );
    }

    private MaterialItem materialWithId(StoredMaterial stored) {
        MaterialItem material = stored.material();
        String id = material.id() == null || material.id().isBlank() ? stored.itemKey() : material.id();
        return new MaterialItem(id, material.material(), material.volume(), material.taxa(), material.situacao());
    }

    private java.util.Optional<StoredMaterial> findStoredMaterial(String id) {
        String normalized = normalize(id);
        return readStoredMaterials().stream()
            .filter(item -> normalize(item.itemKey()).equals(normalized) || normalize(materialWithId(item).id()).equals(normalized))
            .findFirst();
    }

    private List<StoredMaterial> readStoredMaterials() {
        return jdbc.query(
            "select item_key, sort_order, payload from dashboard_seed_data where category = ? order by sort_order, item_key",
            (resultSet, rowNumber) -> new StoredMaterial(
                resultSet.getString("item_key"),
                resultSet.getInt("sort_order"),
                readPayload(resultSet.getString("payload"), MaterialItem.class)
            ),
            "materiais"
        );
    }

    private int nextMaterialSortOrder() {
        return readStoredMaterials().stream()
            .mapToInt(StoredMaterial::sortOrder)
            .max()
            .orElse(0) + 1;
    }

    private String nextMaterialId() {
        int nextNumber = readStoredMaterials().stream()
            .map(this::materialWithId)
            .map(MaterialItem::id)
            .filter(id -> id != null && id.startsWith("MAT-"))
            .mapToInt(id -> {
                try {
                    return Integer.parseInt(id.replace("MAT-", ""));
                } catch (NumberFormatException exception) {
                    return 0;
                }
            })
            .max()
            .orElse(0) + 1;
        return "MAT-%03d".formatted(nextNumber);
    }

    private java.util.Optional<StoredPartner> findStoredParceiro(String parceiro) {
        String normalized = normalize(parceiro);
        return readStoredPartners().stream()
            .filter(item -> normalize(item.partner().parceiro()).equals(normalized))
            .findFirst();
    }

    private List<StoredPartner> readStoredPartners() {
        return jdbc.query(
            "select item_key, sort_order, payload from dashboard_seed_data where category = ? order by sort_order, item_key",
            (resultSet, rowNumber) -> new StoredPartner(
                resultSet.getString("item_key"),
                resultSet.getInt("sort_order"),
                readPayload(resultSet.getString("payload"), PartnerItem.class)
            ),
            "parceiros"
        );
    }

    private int nextPartnerSortOrder() {
        return readStoredPartners().stream()
            .mapToInt(StoredPartner::sortOrder)
            .max()
            .orElse(0) + 1;
    }

    private String partnerKey(String parceiro) {
        String key = normalizeFilePart(parceiro);
        return key.isBlank() ? shortHash() : key;
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

    private record StoredMaterial(String itemKey, int sortOrder, MaterialItem material) {
    }

    private record StoredPartner(String itemKey, int sortOrder, PartnerItem partner) {
    }

    private record StoredCertificate(String itemKey, int sortOrder, CertificateItem certificate) {
    }
}
