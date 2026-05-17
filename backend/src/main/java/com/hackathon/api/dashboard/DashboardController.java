package com.hackathon.api.dashboard;

import com.hackathon.api.dashboard.DashboardData.ComprovacaoResponse;
import com.hackathon.api.dashboard.DashboardData.CompanyProfile;
import com.hackathon.api.dashboard.DashboardData.CreateComprovacaoRequest;
import com.hackathon.api.dashboard.DashboardData.CertificateItem;
import com.hackathon.api.dashboard.DashboardData.HelpItem;
import com.hackathon.api.dashboard.DashboardData.LogoutResponse;
import com.hackathon.api.dashboard.DashboardData.MaterialItem;
import com.hackathon.api.dashboard.DashboardData.AppShellData;
import com.hackathon.api.dashboard.DashboardData.NotificationItem;
import com.hackathon.api.dashboard.DashboardData.PartnerItem;
import com.hackathon.api.dashboard.DashboardData.ReportItem;
import com.hackathon.api.dashboard.DashboardData.SettingItem;
import com.hackathon.api.dashboard.DashboardData.UpdateComprovacaoRequest;
import com.hackathon.api.dashboard.DashboardData.UpdateComprovacaoStatusRequest;
import com.hackathon.api.user.User;
import com.hackathon.api.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
    NotificationItem markNotificationRead(@org.springframework.web.bind.annotation.PathVariable String id) {
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
        @org.springframework.web.bind.annotation.PathVariable String id,
        @Valid @RequestBody UpdateComprovacaoRequest request
    ) {
        return dashboardService.updateComprovacao(id, request);
    }

    @PostMapping("/comprovacoes/{id}/status")
    ComprovacaoResponse updateComprovacaoStatus(
        @org.springframework.web.bind.annotation.PathVariable String id,
        @Valid @RequestBody UpdateComprovacaoStatusRequest request
    ) {
        return dashboardService.updateComprovacaoStatus(id, request);
    }

    @GetMapping("/materiais")
    List<MaterialItem> materiais(@RequestParam(required = false) String query) {
        return dashboardService.materiais(query);
    }

    @GetMapping("/parceiros")
    List<PartnerItem> parceiros(@RequestParam(required = false) String query) {
        return dashboardService.parceiros(query);
    }

    @GetMapping("/certificados")
    List<CertificateItem> certificados(@RequestParam(required = false) String query) {
        return dashboardService.certificados(query);
    }

    @GetMapping("/relatorios")
    List<ReportItem> relatorios(@RequestParam(required = false) String query) {
        return dashboardService.relatorios(query);
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
