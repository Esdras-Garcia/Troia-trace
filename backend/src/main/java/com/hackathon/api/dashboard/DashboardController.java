package com.hackathon.api.dashboard;

import com.hackathon.api.dashboard.DashboardData.ComprovacaoResponse;
import com.hackathon.api.dashboard.DashboardData.CreateComprovacaoRequest;
import com.hackathon.api.dashboard.DashboardData.CertificateItem;
import com.hackathon.api.dashboard.DashboardData.HelpItem;
import com.hackathon.api.dashboard.DashboardData.MaterialItem;
import com.hackathon.api.dashboard.DashboardData.AppShellData;
import com.hackathon.api.dashboard.DashboardData.PartnerItem;
import com.hackathon.api.dashboard.DashboardData.ReportItem;
import com.hackathon.api.dashboard.DashboardData.SettingItem;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api")
public class DashboardController {

    private final DashboardService dashboardService;

    DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/dashboard")
    DashboardData dashboard() {
        return dashboardService.dashboard();
    }

    @GetMapping("/app-shell")
    AppShellData appShell() {
        return dashboardService.appShell();
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
}
