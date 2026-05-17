package com.hackathon.api.docs;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
public class OpenApiController {

    @GetMapping("/v3/api-docs")
    Map<String, Object> openApi() {
        Map<String, Object> paths = new LinkedHashMap<>();
        paths.put("/api/health", path(get("Health check")));
        paths.put("/api/dashboard", path(get("Dados agregados da tela inicial")));
        paths.put("/api/app-shell", path(getSchema("Dados de cabecalho, usuario, periodo e paginas", "AppShellData")));
        paths.put("/api/comprovacoes", path(
            get("Lista comprovacoes com filtro opcional por query"),
            post("Cria comprovacao de lastro", "CreateComprovacaoRequest", "ComprovacaoResponse")
        ));
        paths.put("/api/materiais", path(getArray("Lista materiais monitorados", "MaterialItem")));
        paths.put("/api/parceiros", path(getArray("Lista parceiros", "PartnerItem")));
        paths.put("/api/certificados", path(getArray("Lista certificados", "CertificateItem")));
        paths.put("/api/relatorios", path(getArray("Lista relatorios", "ReportItem")));
        paths.put("/api/configuracoes", path(getArray("Lista configuracoes", "SettingItem")));
        paths.put("/api/ajuda", path(getArray("Lista itens de ajuda", "HelpItem")));
        paths.put("/api/users", path(
            get("Lista usuarios"),
            post("Cria usuario", "CreateUserRequest", "UserResponse")
        ));

        return Map.of(
            "openapi", "3.0.3",
            "info", Map.of(
                "title", "Troia Trace API",
                "version", "1.0.0",
                "description", "API para dashboard de logistica reversa, comprovacoes, parceiros, certificados e relatorios."
            ),
            "servers", List.of(Map.of("url", "http://localhost:8085")),
            "paths", paths,
            "components", components()
        );
    }

    @GetMapping(value = "/swagger-ui.html", produces = MediaType.TEXT_HTML_VALUE)
    String swaggerUi() {
        return """
            <!doctype html>
            <html lang="pt-BR">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>Troia Trace API Swagger</title>
              <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
            </head>
            <body>
              <div id="swagger-ui"></div>
              <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
              <script>
                window.ui = SwaggerUIBundle({ url: '/v3/api-docs', dom_id: '#swagger-ui' });
              </script>
            </body>
            </html>
            """;
    }

    private Map<String, Object> components() {
        Map<String, Object> schemas = new LinkedHashMap<>();
        schemas.put("CreateComprovacaoRequest", object(Map.of(
                "material", stringExample("Plastico PET"),
                "quantidadeKg", Map.of("type", "number", "format", "double", "example", 1250),
                "tipo", stringExample("Coleta"),
                "parceiro", stringExample("RecycleTech Ltda"),
                "observacoes", stringExample("Nota fiscal anexada")
            ), List.of("material", "quantidadeKg", "tipo", "parceiro")));
        schemas.put("ComprovacaoResponse", object(Map.of(
                "id", stringExample("COMP-006"),
                "hashLastro", stringExample("0x4f8a...1f3d"),
                "material", stringExample("Plastico PET"),
                "quantidade", stringExample("1.250 kg"),
                "parceiro", stringExample("RecycleTech Ltda"),
                "dataEmissao", stringExample("16 mai. 2026"),
                "status", stringExample("pendente"),
                "tipo", stringExample("Coleta"),
                "observacoes", stringExample("Nota fiscal anexada")
            ), List.of()));
        schemas.put("MaterialItem", object(Map.of(
                "material", stringExample("Plastico PET"),
                "volume", stringExample("4.620 kg"),
                "taxa", stringExample("94%"),
                "situacao", stringExample("Alto volume")
            ), List.of()));
        schemas.put("PartnerItem", object(Map.of(
                "parceiro", stringExample("RecycleTech Ltda"),
                "atuacao", stringExample("Coleta e triagem"),
                "status", stringExample("Homologado"),
                "sla", stringExample("98%")
            ), List.of()));
        schemas.put("CertificateItem", object(Map.of(
                "id", stringExample("CERT-2048"),
                "material", stringExample("Plastico PET"),
                "status", stringExample("Aprovado"),
                "data", stringExample("15 Mai 2026")
            ), List.of()));
        schemas.put("ReportItem", object(Map.of(
                "relatorio", stringExample("Rastreabilidade completa"),
                "formato", stringExample("PDF"),
                "status", stringExample("Pronto")
            ), List.of()));
        schemas.put("SettingItem", object(Map.of(
                "title", stringExample("Margem de tolerancia de peso"),
                "description", stringExample("Configuracao operacional para validar comprovacoes e certificados."),
                "progress", Map.of("type", "integer", "example", 82)
            ), List.of()));
        schemas.put("HelpItem", object(Map.of(
                "title", stringExample("Central de ajuda"),
                "description", stringExample("Guias para registrar comprovacoes, homologar parceiros, validar certificados e gerar relatorios ESG."),
                "action", stringExample("comprovacoes")
            ), List.of()));
        schemas.put("UserProfile", object(Map.of(
                "name", stringExample("Empresa Corp"),
                "role", stringExample("Admin")
            ), List.of()));
        schemas.put("PageMetadata", object(Map.of(
                "key", stringExample("overview"),
                "title", stringExample("Visao Geral"),
                "subtitle", stringExample("Acompanhe suas comprovacoes de logistica reversa."),
                "section", stringExample("menu")
            ), List.of()));
        schemas.put("AppShellData", object(Map.of(
                "brandName", stringExample("Troia Trace"),
                "brandSubtitle", stringExample("Logistica Reversa"),
                "period", stringExample("Maio 2026"),
                "user", ref("UserProfile"),
                "notificationsCount", Map.of("type", "integer", "example", 3),
                "pages", Map.of("type", "array", "items", ref("PageMetadata"))
            ), List.of()));
        schemas.put("CreateUserRequest", object(Map.of(
                "name", stringExample("Empresa Corp"),
                "email", stringExample("admin@empresa.com")
            ), List.of("name", "email")));
        schemas.put("UserResponse", object(Map.of(
                "id", Map.of("type", "string", "format", "uuid"),
                "name", stringExample("Empresa Corp"),
                "email", stringExample("admin@empresa.com"),
                "createdAt", Map.of("type", "string", "format", "date-time")
            ), List.of()));

        return Map.of("schemas", schemas);
    }

    private Map<String, Object> get(String summary) {
        return Map.of("get", operation(summary, null, null));
    }

    private Map<String, Object> getSchema(String summary, String responseSchema) {
        return Map.of("get", schemaOperation(summary, responseSchema));
    }

    private Map<String, Object> getArray(String summary, String responseSchema) {
        return Map.of("get", arrayOperation(summary, responseSchema));
    }

    private Map<String, Object> post(String summary, String requestSchema, String responseSchema) {
        return Map.of("post", operation(summary, requestSchema, responseSchema));
    }

    @SafeVarargs
    private Map<String, Object> path(Map<String, Object>... operations) {
        Map<String, Object> result = new LinkedHashMap<>();
        for (Map<String, Object> operation : operations) {
            result.putAll(operation);
        }
        return result;
    }

    private Map<String, Object> operation(String summary, String requestSchema, String responseSchema) {
        Map<String, Object> operation = new LinkedHashMap<>();
        operation.put("summary", summary);
        if (requestSchema != null) {
            operation.put("requestBody", Map.of(
                "required", true,
                "content", Map.of("application/json", Map.of("schema", ref(requestSchema)))
            ));
        }
        operation.put("responses", Map.of(
            "200", responseSchema == null ? Map.of("description", "OK") : jsonResponse("OK", responseSchema),
            "201", responseSchema == null ? Map.of("description", "Created") : jsonResponse("Created", responseSchema),
            "400", Map.of("description", "Payload invalido")
        ));
        return operation;
    }

    private Map<String, Object> arrayOperation(String summary, String responseSchema) {
        return Map.of(
            "summary", summary,
            "responses", Map.of(
                "200", Map.of(
                    "description", "OK",
                    "content", Map.of("application/json", Map.of("schema", Map.of(
                        "type", "array",
                        "items", ref(responseSchema)
                    )))
                )
            )
        );
    }

    private Map<String, Object> schemaOperation(String summary, String responseSchema) {
        return Map.of(
            "summary", summary,
            "responses", Map.of(
                "200", jsonResponse("OK", responseSchema)
            )
        );
    }

    private Map<String, Object> jsonResponse(String description, String schema) {
        return Map.of(
            "description", description,
            "content", Map.of("application/json", Map.of("schema", ref(schema)))
        );
    }

    private Map<String, Object> ref(String schema) {
        return Map.of("$ref", "#/components/schemas/" + schema);
    }

    private Map<String, Object> stringExample(String example) {
        return Map.of("type", "string", "example", example);
    }

    private Map<String, Object> object(Map<String, Object> properties, List<String> required) {
        return Map.of("type", "object", "properties", properties, "required", required);
    }
}
