package com.hackathon.api.dashboard;

import com.hackathon.api.dashboard.DashboardData.ComprovacaoResponse;
import com.hackathon.api.dashboard.DashboardData.CompanyProfile;
import com.hackathon.api.dashboard.DashboardData.CreateComprovacaoRequest;
import com.hackathon.api.dashboard.DashboardData.GenerateReportRequest;
import com.hackathon.api.dashboard.DashboardData.EvidenceRequest;
import com.hackathon.api.dashboard.DashboardData.CertificateItem;
import com.hackathon.api.dashboard.DashboardData.CertificateRequest;
import com.hackathon.api.dashboard.DashboardData.HelpItem;
import com.hackathon.api.dashboard.DashboardData.LogoutResponse;
import com.hackathon.api.dashboard.DashboardData.MaterialItem;
import com.hackathon.api.dashboard.DashboardData.MobileBootstrap;
import com.hackathon.api.dashboard.DashboardData.MobileMe;
import com.hackathon.api.dashboard.DashboardData.AppShellData;
import com.hackathon.api.dashboard.DashboardData.NotificationItem;
import com.hackathon.api.dashboard.DashboardData.PartnerItem;
import com.hackathon.api.dashboard.DashboardData.PartnerRequest;
import com.hackathon.api.dashboard.DashboardData.ReportItem;
import com.hackathon.api.dashboard.DashboardData.SettingItem;
import com.hackathon.api.dashboard.DashboardData.UpdateComprovacaoRequest;
import com.hackathon.api.dashboard.DashboardData.UpdateComprovacaoStatusRequest;
import com.hackathon.api.dashboard.DashboardData.CreateMaterialRequest;
import com.hackathon.api.dashboard.DashboardData.UpdateMaterialRequest;
import com.hackathon.api.user.User;
import com.hackathon.api.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class DashboardController {

    private final DashboardService dashboardService;
    private final UserRepository users;

    DashboardController(DashboardService dashboardService, UserRepository users) {
        this.dashboardService = dashboardService;
        this.users = users;
    }

    @GetMapping("/dashboard")
    DashboardData dashboard(HttpServletRequest request) {
        return dashboardService.dashboard(authenticatedUser(request));
    }

    @GetMapping("/app-shell")
    AppShellData appShell(HttpServletRequest request) {
        return dashboardService.appShell(authenticatedUser(request));
    }

    @GetMapping("/profile/company")
    CompanyProfile companyProfile(HttpServletRequest request) {
        return dashboardService.companyProfile(authenticatedUser(request));
    }

    @GetMapping("/notifications")
    List<NotificationItem> notifications() {
        return dashboardService.notifications();
    }

    @PostMapping("/notifications/{id}/read")
    NotificationItem markNotificationRead(@PathVariable String id) {
        return dashboardService.markNotificationRead(id);
    }

    @PostMapping("/auth/logout")
    LogoutResponse logout() {
        return dashboardService.logout();
    }

    @GetMapping("/comprovacoes")
    List<ComprovacaoResponse> comprovacoes(@RequestParam(required = false) String query) {
        return dashboardService.listComprovacoes(query);
    }

    @PostMapping("/comprovacoes")
    ResponseEntity<ComprovacaoResponse> createComprovacao(@Valid @RequestBody CreateComprovacaoRequest request) {
        ComprovacaoResponse response = dashboardService.createComprovacao(request);
        return ResponseEntity.created(URI.create("/api/comprovacoes/" + response.id())).body(response);
    }

    @PutMapping("/comprovacoes/{id}")
    ComprovacaoResponse updateComprovacao(
        @PathVariable String id,
        @Valid @RequestBody UpdateComprovacaoRequest request
    ) {
        return dashboardService.updateComprovacao(id, request);
    }

    @PostMapping("/comprovacoes/{id}/status")
    ComprovacaoResponse updateComprovacaoStatus(
        @PathVariable String id,
        @Valid @RequestBody UpdateComprovacaoStatusRequest request
    ) {
        return dashboardService.updateComprovacaoStatus(id, request);
    }

    @GetMapping("/mobile/me")
    MobileMe mobileMe(HttpServletRequest request) {
        return dashboardService.mobileMe(authenticatedUser(request));
    }

    @GetMapping("/mobile/sync/bootstrap")
    MobileBootstrap mobileBootstrap(HttpServletRequest request) {
        return dashboardService.mobileBootstrap(authenticatedUser(request));
    }

    @GetMapping("/mobile/tasks")
    List<ComprovacaoResponse> mobileTasks(@RequestParam(required = false) String query) {
        return dashboardService.listComprovacoes(query);
    }

    @GetMapping("/mobile/qrcodes/{code}")
    ComprovacaoResponse mobileQrCode(@PathVariable String code) {
        return dashboardService.mobileFindByCode(code);
    }

    @PostMapping("/mobile/qrcodes/{code}/scan")
    ComprovacaoResponse mobileQrScan(@PathVariable String code) {
        return dashboardService.mobileFindByCode(code);
    }

    @GetMapping("/mobile/comprovacoes/{id}")
    ComprovacaoResponse mobileComprovacao(@PathVariable String id) {
        return dashboardService.mobileFindByCode(id);
    }

    @PostMapping("/mobile/comprovacoes/{id}/status")
    ComprovacaoResponse mobileUpdateStatus(
        @PathVariable String id,
        @Valid @RequestBody UpdateComprovacaoStatusRequest request
    ) {
        return dashboardService.updateComprovacaoStatus(id, request);
    }

    @PostMapping("/mobile/comprovacoes/{id}/conferencia")
    ComprovacaoResponse mobileConferencia(
        @PathVariable String id,
        @Valid @RequestBody UpdateComprovacaoStatusRequest request
    ) {
        return dashboardService.updateComprovacaoStatus(id, request);
    }

    @PostMapping("/mobile/comprovacoes/{id}/evidencias")
    ComprovacaoResponse mobileEvidencia(
        @PathVariable String id,
        @Valid @RequestBody EvidenceRequest request
    ) {
        return dashboardService.attachEvidence(id, request);
    }

    @PostMapping("/mobile/comprovacoes/{id}/destinacao")
    ComprovacaoResponse mobileDestinacao(
        @PathVariable String id,
        @Valid @RequestBody UpdateComprovacaoStatusRequest request
    ) {
        return dashboardService.updateComprovacaoStatus(id, request);
    }

    @PostMapping("/mobile/comprovacoes/{id}/certificados")
    CertificateItem mobileCertificado(
        @PathVariable String id,
        @Valid @RequestBody CertificateRequest request
    ) {
        return dashboardService.createCertificado(request);
    }

    @GetMapping("/mobile/comprovacoes/{id}/historico")
    ComprovacaoResponse mobileHistorico(@PathVariable String id) {
        return dashboardService.mobileFindByCode(id);
    }

    @GetMapping("/materiais")
    List<MaterialItem> materiais(@RequestParam(required = false) String query) {
        return dashboardService.materiais(query);
    }

    @PostMapping("/materiais")
    @ResponseStatus(HttpStatus.CREATED)
    MaterialItem createMaterial(@Valid @RequestBody CreateMaterialRequest request) {
        return dashboardService.createMaterial(request);
    }

    @PutMapping("/materiais/{id}")
    MaterialItem updateMaterial(@PathVariable String id, @Valid @RequestBody UpdateMaterialRequest request) {
        return dashboardService.updateMaterial(id, request);
    }

    @DeleteMapping("/materiais/{id}")
    MaterialItem deleteMaterial(@PathVariable String id) {
        return dashboardService.deleteMaterial(id);
    }

    @GetMapping("/parceiros")
    List<PartnerItem> parceiros(@RequestParam(required = false) String query) {
        return dashboardService.parceiros(query);
    }

    @PostMapping("/parceiros")
    @ResponseStatus(HttpStatus.CREATED)
    PartnerItem createParceiro(@Valid @RequestBody PartnerRequest request) {
        return dashboardService.createParceiro(request);
    }

    @PutMapping("/parceiros/{parceiro}")
    PartnerItem updateParceiro(@PathVariable String parceiro, @Valid @RequestBody PartnerRequest request) {
        return dashboardService.updateParceiro(parceiro, request);
    }

    @DeleteMapping("/parceiros/{parceiro}")
    PartnerItem deleteParceiro(@PathVariable String parceiro) {
        return dashboardService.deleteParceiro(parceiro);
    }

    @GetMapping("/certificados")
    List<CertificateItem> certificados(@RequestParam(required = false) String query) {
        return dashboardService.certificados(query);
    }

    @PostMapping("/certificados")
    @ResponseStatus(HttpStatus.CREATED)
    CertificateItem createCertificado(@Valid @RequestBody CertificateRequest request) {
        return dashboardService.createCertificado(request);
    }

    @PutMapping("/certificados/{id}")
    CertificateItem updateCertificado(@PathVariable String id, @Valid @RequestBody CertificateRequest request) {
        return dashboardService.updateCertificado(id, request);
    }

    @DeleteMapping("/certificados/{id}")
    CertificateItem deleteCertificado(@PathVariable String id) {
        return dashboardService.deleteCertificado(id);
    }

    @GetMapping("/relatorios")
    List<ReportItem> relatorios(@RequestParam(required = false) String query) {
        return dashboardService.relatorios(query);
    }

    @PostMapping("/relatorios")
    ReportItem generateReport(@Valid @RequestBody GenerateReportRequest request) {
        return dashboardService.generateReport(request);
    }

    @GetMapping("/relatorios/{fileName}/download")
    ResponseEntity<byte[]> downloadReport(@PathVariable String fileName) {
        byte[] content = dashboardService.exportReport(fileName);
        String contentType = fileName.endsWith(".pdf") ? "application/pdf" : 
                            fileName.endsWith(".csv") ? "text/csv" : 
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
            .contentType(MediaType.parseMediaType(contentType))
            .body(content);
    }

    @GetMapping("/configuracoes")
    List<SettingItem> configuracoes(@RequestParam(required = false) String query) {
        return dashboardService.configuracoes(query);
    }

    @GetMapping("/ajuda")
    List<HelpItem> ajuda(@RequestParam(required = false) String query) {
        return dashboardService.ajuda(query);
    }

    private User authenticatedUser(HttpServletRequest request) {
        String subject = String.valueOf(request.getAttribute("auth.subject"));
        try {
            return users.findById(UUID.fromString(subject))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario autenticado nao encontrado"));
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token invalido");
        }
    }
}
