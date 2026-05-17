package com.hackathon.api.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    private final JwtService jwtService;

    AuthInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            response.sendError(HttpStatus.UNAUTHORIZED.value(), "Token ausente");
            return false;
        }

        try {
            JwtService.JwtClaims claims = jwtService.validate(authorization.substring("Bearer ".length()));
            request.setAttribute("auth.subject", claims.subject());
            request.setAttribute("auth.name", claims.name());
            return true;
        } catch (IllegalArgumentException exception) {
            response.sendError(HttpStatus.UNAUTHORIZED.value(), "Token invalido");
            return false;
        }
    }
}
