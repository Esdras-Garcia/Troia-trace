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
        paths.put("/api/health", path(publicGet("Health check")));
        paths.put("/api/auth/login", path(publicPost("Autentica usuário e retorna JWT", "LoginRequest", "LoginResponse")));
        paths.put("/api/auth/register", path(publicPost("Cadastra empresa, criptografa senha e retorna JWT", "RegisterRequest", "LoginResponse")));
        paths.put("/api/auth/logout", path(post("Encerra sessão atual", null, "LogoutResponse")));
        paths.put("/api/dashboard", path(get("Dados agregados da tela inicial")));
        paths.put("/api/app-shell", path(getSchema("Dados de cabecalho, usuario, periodo e paginas", "AppShellData")));
        paths.put("/api/profile/company", path(getSchema("Perfil da empresa logada", "CompanyProfile")));
        paths.put("/api/notifications", path(getArray("Lista notificações do usuário", "NotificationItem")));
        paths.put("/api/notifications/{id}/read", path(post("Marca notificação como lida", null, "NotificationItem")));
        paths.put("/api/comprovacoes", path(
            get("Lista comprovações com filtro opcional por query"),
            post("Cria comprovação de lastro", "CreateComprovacaoRequest", "ComprovacaoResponse")
        ));
        paths.put("/api/materiais", path(getArray("Lista materiais monitorados", "MaterialItem")));
        paths.put("/api/parceiros", path(getArray("Lista parceiros", "PartnerItem")));
        paths.put("/api/certificados", path(getArray("Lista certificados", "CertificateItem")));
        paths.put("/api/relatorios", path(getArray("Lista relatórios", "ReportItem")));
        paths.put("/api/configuracoes", path(getArray("Lista configurações", "SettingItem")));
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
                "description", "API para dashboard de logística reversa, comprovações, parceiros, certificados e relatórios."
            ),
            "servers", List.of(Map.of("url", "http://localhost:8085")),
            "paths", paths,
            "components", components(),
            "security", List.of(Map.of("bearerAuth", List.of()))
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
        schemas.put("LoginRequest", object(Map.of(
                "email", stringExample("contato@empresa.com"),
                "password", stringExample("senha-segura")
            ), List.of("email", "password")));
        schemas.put("RegisterRequest", object(Map.of(
                "name", stringExample("Empresa Exemplo"),
                "document", stringExample("12.345.678/0001-90"),
                "email", stringExample("contato@empresa.com"),
                "phone", stringExample("(11) 4002-8922"),
                "address", stringExample("Av. Paulista, 1000 - São Paulo, SP"),
                "plan", stringExample("Enterprise"),
                "password", stringExample("senha-segura")
            ), List.of("name", "document", "email", "phone", "address", "plan", "password")));
        schemas.put("LoginResponse", object(Map.of(
                "token", stringExample("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."),
                "user", ref("AuthUser")
            ), List.of()));
        schemas.put("AuthUser", object(Map.of(
                "id", Map.of("type", "string", "format", "uuid"),
                "name", stringExample("Empresa Exemplo"),
                "email", stringExample("contato@empresa.com")
            ), List.of()));
        schemas.put("LogoutResponse", object(Map.of(
                "loggedOut", Map.of("type", "boolean", "example", true),
                "message", stringExample("Sessao encerrada")
            ), List.of()));
        schemas.put("CreateComprovacaoRequest", object(Map.of(
                "material", stringExample("Material reciclavel"),
                "quantidadeKg", Map.of("type", "number", "format", "double", "example", 1250),
                "tipo", stringExample("Coleta"),
                "parceiro", stringExample("Parceiro responsavel"),
                "observacoes", stringExample("Nota fiscal anexada")
            ), List.of("material", "quantidadeKg", "tipo", "parceiro")));
        schemas.put("ComprovacaoResponse", object(Map.of(
                "id", stringExample("COMP-006"),
                "hashLastro", stringExample("0x4f8a...1f3d"),
                "material", stringExample("Material reciclavel"),
                "quantidade", stringExample("1.250 kg"),
                "parceiro", stringExample("Parceiro responsavel"),
                "dataEmissao", stringExample("16 mai. 2026"),
                "status", stringExample("pendente"),
                "tipo", stringExample("Coleta"),
                "observacoes", stringExample("Nota fiscal anexada")
            ), List.of()));
        schemas.put("MaterialItem", object(Map.of(
                "material", stringExample("Material reciclavel"),
                "volume", stringExample("4.620 kg"),
                "taxa", stringExample("94%"),
                "situacao", stringExample("Alto volume")
            ), List.of()));
        schemas.put("PartnerItem", object(Map.of(
                "parceiro", stringExample("Parceiro responsavel"),
                "atuacao", stringExample("Coleta e triagem"),
                "status", stringExample("Homologado"),
                "sla", stringExample("98%")
            ), List.of()));
        schemas.put("CertificateItem", object(Map.of(
                "id", stringExample("CERT-2048"),
                "material", stringExample("Material reciclavel"),
                "status", stringExample("Aprovado"),
                "data", stringExample("15 Mai 2026")
            ), List.of()));
        schemas.put("ReportItem", object(Map.of(
                "relatorio", stringExample("Relatorio operacional"),
                "formato", stringExample("PDF"),
                "status", stringExample("Pronto")
            ), List.of()));
        schemas.put("SettingItem", object(Map.of(
                "title", stringExample("Margem de tolerância de peso"),
                "description", stringExample("Configuração operacional para validar comprovações e certificados."),
                "progress", Map.of("type", "integer", "example", 82)
            ), List.of()));
        schemas.put("HelpItem", object(Map.of(
                "title", stringExample("Item de ajuda"),
                "description", stringExample("Guias para registrar comprovações, homologar parceiros, validar certificados e gerar relatórios ESG."),
                "action", stringExample("comprovacoes")
            ), List.of()));
        schemas.put("UserProfile", object(Map.of(
                "name", stringExample("Empresa Exemplo"),
                "role", stringExample("Admin")
            ), List.of()));
        schemas.put("PageMetadata", object(Map.of(
                "key", stringExample("overview"),
                "title", stringExample("Visão Geral"),
                "subtitle", stringExample("Acompanhe suas comprovações de logística reversa."),
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
        schemas.put("CompanyProfile", object(Map.of(
                "companyName", stringExample("Empresa Exemplo"),
                "document", stringExample("12.345.678/0001-90"),
                "email", stringExample("contato@empresa.com"),
                "phone", stringExample("(11) 4002-8922"),
                "address", stringExample("Av. Paulista, 1000 - São Paulo, SP"),
                "plan", stringExample("Enterprise"),
                "status", stringExample("Ativo")
            ), List.of()));
        schemas.put("NotificationItem", object(Map.of(
                "id", stringExample("NOT-001"),
                "title", stringExample("Notificação"),
                "message", stringExample("Mensagem da notificação"),
                "createdAt", Map.of("type", "string", "format", "date-time"),
                "read", Map.of("type", "boolean", "example", false),
                "tone", stringExample("primary")
            ), List.of()));
        schemas.put("CreateUserRequest", object(Map.of(
                "name", stringExample("Empresa Exemplo"),
                "email", stringExample("contato@empresa.com"),
                "password", stringExample("senha-segura")
            ), List.of("name", "email", "password")));
        schemas.put("UserResponse", object(Map.of(
                "id", Map.of("type", "string", "format", "uuid"),
                "name", stringExample("Empresa Exemplo"),
                "email", stringExample("contato@empresa.com"),
                "createdAt", Map.of("type", "string", "format", "date-time")
            ), List.of()));

        return Map.of(
            "schemas", schemas,
            "securitySchemes", Map.of(
                "bearerAuth", Map.of(
                    "type", "http",
                    "scheme", "bearer",
                    "bearerFormat", "JWT"
                )
            )
        );
    }

    private Map<String, Object> get(String summary) {
        return Map.of("get", operation(summary, null, null));
    }

    private Map<String, Object> publicGet(String summary) {
        return Map.of("get", operation(summary, null, null, true));
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

    private Map<String, Object> publicPost(String summary, String requestSchema, String responseSchema) {
        return Map.of("post", operation(summary, requestSchema, responseSchema, true));
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
        return operation(summary, requestSchema, responseSchema, false);
    }

    private Map<String, Object> operation(String summary, String requestSchema, String responseSchema, boolean publicEndpoint) {
        Map<String, Object> operation = new LinkedHashMap<>();
        operation.put("summary", summary);
        if (publicEndpoint) {
            operation.put("security", List.of());
        }
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
