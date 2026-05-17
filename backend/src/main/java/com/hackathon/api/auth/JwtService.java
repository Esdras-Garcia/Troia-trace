package com.hackathon.api.auth;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class JwtService {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final byte[] secret;

    public JwtService(@Value("${app.jwt.secret:troia-trace-local-dev-secret-change-me}") String secret) {
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
    }

    public String createToken(String subject, String name) {
        Instant now = Instant.now();
        Map<String, Object> header = Map.of("alg", "HS256", "typ", "JWT");
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sub", subject);
        payload.put("name", name);
        payload.put("iat", now.getEpochSecond());
        payload.put("exp", now.plusSeconds(60 * 60 * 8).getEpochSecond());

        String unsigned = "%s.%s".formatted(toBase64Json(header), toBase64Json(payload));
        return "%s.%s".formatted(unsigned, sign(unsigned));
    }

    public JwtClaims validate(String token) {
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw new IllegalArgumentException("Token invalido");
        }

        String unsigned = parts[0] + "." + parts[1];
        if (!constantTimeEquals(sign(unsigned), parts[2])) {
            throw new IllegalArgumentException("Assinatura invalida");
        }

        Map<?, ?> payload = readPayload(parts[1]);
        long exp = ((Number) payload.get("exp")).longValue();
        if (Instant.now().getEpochSecond() >= exp) {
            throw new IllegalArgumentException("Token expirado");
        }

        return new JwtClaims(String.valueOf(payload.get("sub")), String.valueOf(payload.get("name")));
    }

    private String toBase64Json(Map<String, Object> value) {
        try {
            return base64Url(objectMapper.writeValueAsBytes(value));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Nao foi possivel criar token", exception);
        }
    }

    private Map<?, ?> readPayload(String payload) {
        try {
            return objectMapper.readValue(Base64.getUrlDecoder().decode(payload), Map.class);
        } catch (Exception exception) {
            throw new IllegalArgumentException("Payload invalido", exception);
        }
    }

    private String sign(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return base64Url(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Nao foi possivel assinar token", exception);
        }
    }

    private String base64Url(byte[] value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value);
    }

    private boolean constantTimeEquals(String first, String second) {
        return MessageDigestHolder.equals(first.getBytes(StandardCharsets.UTF_8), second.getBytes(StandardCharsets.UTF_8));
    }

    public record JwtClaims(String subject, String name) {
    }

    private static class MessageDigestHolder {
        static boolean equals(byte[] first, byte[] second) {
            return java.security.MessageDigest.isEqual(first, second);
        }
    }
}
