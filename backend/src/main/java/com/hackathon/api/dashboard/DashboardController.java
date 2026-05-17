package com.hackathon.api.dashboard;

import com.hackathon.api.dashboard.DashboardData.ComprovacaoResponse;
import com.hackathon.api.dashboard.DashboardData.CreateComprovacaoRequest;
import com.hackathon.api.dashboard.DashboardData.HelpItem;
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
    List<List<String>> materiais() {
        return dashboardService.materiais();
    }

    @GetMapping("/parceiros")
    List<List<String>> parceiros() {
        return dashboardService.parceiros();
    }

    @GetMapping("/certificados")
    List<List<String>> certificados() {
        return dashboardService.certificados();
    }

    @GetMapping("/relatorios")
    List<List<String>> relatorios() {
        return dashboardService.relatorios();
    }

    @GetMapping("/configuracoes")
    List<SettingItem> configuracoes() {
        return dashboardService.configuracoes();
    }

    @GetMapping("/ajuda")
    List<HelpItem> ajuda() {
        return dashboardService.ajuda();
    }
}
