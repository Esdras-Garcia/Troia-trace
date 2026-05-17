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
        paths.put("/api/comprovacoes", path(
            get("Lista comprovacoes com filtro opcional por query"),
            post("Cria comprovacao de lastro", "CreateComprovacaoRequest", "ComprovacaoResponse")
        ));
        paths.put("/api/materiais", path(get("Lista materiais monitorados")));
        paths.put("/api/parceiros", path(get("Lista parceiros")));
        paths.put("/api/certificados", path(get("Lista certificados")));
        paths.put("/api/relatorios", path(get("Lista relatorios")));
        paths.put("/api/configuracoes", path(get("Lista configuracoes")));
        paths.put("/api/ajuda", path(get("Lista itens de ajuda")));
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
        return Map.of("schemas", Map.of(
            "CreateComprovacaoRequest", object(Map.of(
                "material", stringExample("Plastico PET"),
                "quantidadeKg", Map.of("type", "number", "format", "double", "example", 1250),
                "tipo", stringExample("Coleta"),
                "parceiro", stringExample("RecycleTech Ltda"),
                "observacoes", stringExample("Nota fiscal anexada")
            ), List.of("material", "quantidadeKg", "tipo", "parceiro")),
            "ComprovacaoResponse", object(Map.of(
                "id", stringExample("COMP-006"),
                "hashLastro", stringExample("0x4f8a...1f3d"),
                "material", stringExample("Plastico PET"),
                "quantidade", stringExample("1.250 kg"),
                "parceiro", stringExample("RecycleTech Ltda"),
                "dataEmissao", stringExample("16 mai. 2026"),
                "status", stringExample("pendente"),
                "tipo", stringExample("Coleta"),
                "observacoes", stringExample("Nota fiscal anexada")
            ), List.of()),
            "CreateUserRequest", object(Map.of(
                "name", stringExample("Empresa Corp"),
                "email", stringExample("admin@empresa.com")
            ), List.of("name", "email")),
            "UserResponse", object(Map.of(
                "id", Map.of("type", "string", "format", "uuid"),
                "name", stringExample("Empresa Corp"),
                "email", stringExample("admin@empresa.com"),
                "createdAt", Map.of("type", "string", "format", "date-time")
            ), List.of())
        ));
    }

    private Map<String, Object> get(String summary) {
        return Map.of("get", operation(summary, null, null));
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
