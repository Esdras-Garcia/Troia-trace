package com.hackathon.api.dashboard;

import com.hackathon.api.dashboard.DashboardData.Comprovacao;
import com.hackathon.api.dashboard.DashboardData.ComprovacaoResponse;
import com.hackathon.api.dashboard.DashboardData.CreateComprovacaoRequest;
import com.hackathon.api.dashboard.DashboardData.DistributionItem;
import com.hackathon.api.dashboard.DashboardData.HelpItem;
import com.hackathon.api.dashboard.DashboardData.ImpactMetric;
import com.hackathon.api.dashboard.DashboardData.SettingItem;
import com.hackathon.api.dashboard.DashboardData.StatItem;
import com.hackathon.api.dashboard.DashboardData.VolumeItem;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class DashboardService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.forLanguageTag("pt-BR"));
    private final SecureRandom random = new SecureRandom();
    private final AtomicInteger nextComprovacaoNumber = new AtomicInteger(6);
    private final CopyOnWriteArrayList<Comprovacao> comprovacoes = new CopyOnWriteArrayList<>(seedComprovacoes());

    DashboardData dashboard() {
        return new DashboardData(
            stats(),
            listComprovacoes(null),
            volumeData(),
            materialDistribution(),
            impactMetrics(),
            activities(),
            materiais(),
            parceiros(),
            certificados(),
            relatorios(),
            configuracoes(),
            ajuda()
        );
    }

    List<ComprovacaoResponse> listComprovacoes(String query) {
        String normalized = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        return comprovacoes.stream()
            .filter(item -> normalized.isBlank() || searchable(item).contains(normalized))
            .map(this::toResponse)
            .toList();
    }

    ComprovacaoResponse createComprovacao(CreateComprovacaoRequest request) {
        String id = "COMP-%03d".formatted(nextComprovacaoNumber.getAndIncrement());
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
        comprovacoes.add(0, comprovacao);
        return toResponse(comprovacao);
    }

    List<List<String>> materiais() {
        return List.of(
            List.of("Plastico PET", "4.620 kg", "94%", "Alto volume"),
            List.of("Papelao", "3.180 kg", "91%", "Coleta recorrente"),
            List.of("Vidro", "2.410 kg", "88%", "Pendente validacao"),
            List.of("Aluminio", "1.050 kg", "96%", "Certificado"),
            List.of("Plastico PEAD", "780 kg", "72%", "Expirado")
        );
    }

    List<List<String>> parceiros() {
        return List.of(
            List.of("RecycleTech Ltda", "Coleta e triagem", "Homologado", "98%"),
            List.of("EcoPapel S.A.", "Reciclagem de papel", "Homologado", "94%"),
            List.of("VidroVerde Ind.", "Processamento", "Pendente", "87%"),
            List.of("PlastiCycle", "Destinacao final", "Documento vencido", "76%")
        );
    }

    List<List<String>> certificados() {
        return List.of(
            List.of("CERT-2048", "Plastico PET", "Aprovado", "15 Mai 2026"),
            List.of("CERT-2049", "Papelao", "Aprovado", "14 Mai 2026"),
            List.of("CERT-2050", "Vidro", "Em analise", "13 Mai 2026"),
            List.of("CERT-2051", "PEAD", "Rejeitado", "08 Mai 2026")
        );
    }

    List<List<String>> relatorios() {
        return List.of(
            List.of("Rastreabilidade completa", "PDF", "Pronto"),
            List.of("Volume por unidade", "Excel", "Pronto"),
            List.of("Divergencias abertas", "CSV", "Gerando"),
            List.of("Comprovatorio fiscal", "PDF", "Pendente")
        );
    }

    List<SettingItem> configuracoes() {
        return List.of(
            new SettingItem("Margem de tolerancia de peso", "Configuracao operacional para validar comprovacoes e certificados.", 82),
            new SettingItem("Campos obrigatorios", "Configuracao operacional para validar comprovacoes e certificados.", 65),
            new SettingItem("Regras de aprovacao", "Configuracao operacional para validar comprovacoes e certificados.", 91),
            new SettingItem("Notificacoes fiscais", "Configuracao operacional para validar comprovacoes e certificados.", 48)
        );
    }

    List<HelpItem> ajuda() {
        return List.of(
            new HelpItem("Central de ajuda", "Guias para registrar comprovacoes, homologar parceiros, validar certificados e gerar relatorios ESG.", "comprovacoes"),
            new HelpItem("Checklist de implantacao", "Empresa, unidades, materiais, parceiros, templates e certificados iniciais.", "configuracoes")
        );
    }

    private List<StatItem> stats() {
        return List.of(
            new StatItem("Materiais Rastreados", "12.847", "kg", "+12.5%", "up", "vs. mes anterior", "primary"),
            new StatItem("Comprovacoes Ativas", "284", "", "+8.2%", "up", "certificados validos", "accent"),
            new StatItem("Taxa de Reciclagem", "94.2", "%", "+3.1%", "up", "eficiencia do processo", "success"),
            new StatItem("Impacto Ambiental", "2.4", "ton CO2", "-18.5%", "down", "emissoes evitadas", "warning")
        );
    }

    private List<VolumeItem> volumeData() {
        return List.of(
            new VolumeItem("Jan", 1200, 800, 600, 400),
            new VolumeItem("Fev", 1400, 900, 700, 450),
            new VolumeItem("Mar", 1100, 850, 650, 380),
            new VolumeItem("Abr", 1600, 1000, 800, 500),
            new VolumeItem("Mai", 1800, 1100, 900, 550)
        );
    }

    private List<DistributionItem> materialDistribution() {
        return List.of(
            new DistributionItem("Plastico", 35, "#f06a35"),
            new DistributionItem("Papel", 28, "#2bb6d6"),
            new DistributionItem("Vidro", 22, "#31c484"),
            new DistributionItem("Metal", 15, "#e6c75c")
        );
    }

    private List<ImpactMetric> impactMetrics() {
        return List.of(
            new ImpactMetric("CO2 Evitado", 2.4, 5, "ton"),
            new ImpactMetric("Agua Economizada", 12500, 20000, "L"),
            new ImpactMetric("Materiais Reciclados", 12847, 15000, "kg"),
            new ImpactMetric("Arvores Preservadas", 156, 200, "un")
        );
    }

    private List<String> activities() {
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
