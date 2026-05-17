package com.hackathon.api.dashboard;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public record DashboardData(
    AppShellData shell,
    List<StatItem> stats,
    List<ComprovacaoResponse> comprovacoes,
    List<VolumeItem> volumeData,
    List<DistributionItem> materialDistribution,
    List<ImpactMetric> impactMetrics,
    List<String> activities,
    List<MaterialItem> materiais,
    List<PartnerItem> parceiros,
    List<CertificateItem> certificados,
    List<ReportItem> relatorios,
    List<SettingItem> configuracoes,
    List<HelpItem> ajuda
) {
    public record AppShellData(
        String brandName,
        String brandSubtitle,
        String period,
        UserProfile user,
        int notificationsCount,
        List<PageMetadata> pages
    ) {
    }

    public record UserProfile(String name, String role) {
    }

    public record CompanyProfile(
        String companyName,
        String document,
        String email,
        String phone,
        String address,
        String plan,
        String status
    ) {
    }

    public record NotificationItem(
        String id,
        String title,
        String message,
        String createdAt,
        boolean read,
        String tone
    ) {
    }

    public record LogoutResponse(boolean loggedOut, String message) {
    }

    public record PageMetadata(String key, String title, String subtitle, String section) {
    }

    public record StatItem(
        String title,
        String value,
        String unit,
        String change,
        String trend,
        String description,
        String tone
    ) {
    }

    public record ComprovacaoResponse(
        String id,
        String hashLastro,
        String material,
        String quantidade,
        String parceiro,
        String dataEmissao,
        String status,
        String tipo,
        String observacoes
    ) {
    }

    public record CreateComprovacaoRequest(
        @NotBlank @Size(max = 120) String material,
        @NotNull @Positive Double quantidadeKg,
        @NotBlank @Size(max = 80) String tipo,
        @NotBlank @Size(max = 140) String parceiro,
        @Size(max = 500) String observacoes
    ) {
    }

    public record VolumeItem(String mes, int plastico, int papel, int vidro, int metal) {
    }

    public record DistributionItem(String name, int value, String color) {
    }

    public record ImpactMetric(String title, double value, double target, String unit) {
    }

    public record MaterialItem(String material, String volume, String taxa, String situacao) {
    }

    public record PartnerItem(String parceiro, String atuacao, String status, String sla) {
    }

    public record CertificateItem(String id, String material, String status, String data) {
    }

    public record ReportItem(String relatorio, String formato, String status) {
    }

    public record SettingItem(String title, String description, int progress) {
    }

    public record HelpItem(String title, String description, String action) {
    }

    public record Comprovacao(
        String id,
        String hashLastro,
        String material,
        double quantidadeKg,
        String parceiro,
        LocalDate dataEmissao,
        String status,
        String tipo,
        String observacoes
    ) {
    }
}
