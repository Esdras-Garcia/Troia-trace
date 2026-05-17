package com.hackathon.api.auth;

import com.hackathon.api.user.User;
import com.hackathon.api.user.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    AuthController(UserRepository users, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        User user = users.findByEmail(request.email())
            .filter(found -> passwordEncoder.matches(request.password(), found.getPasswordHash()))
            .orElseThrow(() -> new IllegalArgumentException("Credenciais invalidas"));

        return ResponseEntity.ok(new LoginResponse(
            jwtService.createToken(user.getId().toString(), user.getName()),
            new AuthUser(user.getId(), user.getName(), user.getEmail())
        ));
    }

    @PostMapping("/register")
    ResponseEntity<LoginResponse> register(@Valid @RequestBody RegisterRequest request) {
        if (users.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail ja cadastrado");
        }

        User user = users.save(new User(
            request.name(),
            request.email(),
            passwordEncoder.encode(request.password())
        ));

        return ResponseEntity.ok(new LoginResponse(
            jwtService.createToken(user.getId().toString(), user.getName()),
            new AuthUser(user.getId(), user.getName(), user.getEmail())
        ));
    }

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {
    }

    public record RegisterRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Email @Size(max = 180) String email,
        @NotBlank @Size(min = 8, max = 80) String password
    ) {
    }

    public record LoginResponse(String token, AuthUser user) {
    }

    public record AuthUser(UUID id, String name, String email) {
    }
}
