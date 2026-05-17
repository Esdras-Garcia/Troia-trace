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
        if (!isValidCpfCnpj(request.document())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CPF ou CNPJ invalido");
        }

        User user = users.save(new User(
            request.name(),
            request.email(),
            request.document(),
            request.phone(),
            request.address(),
            request.plan(),
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
        @NotBlank @Size(max = 32) String document,
        @NotBlank @Email @Size(max = 180) String email,
        @NotBlank @Size(max = 32) String phone,
        @NotBlank @Size(max = 220) String address,
        @NotBlank @Size(max = 80) String plan,
        @NotBlank @Size(min = 8, max = 80) String password
    ) {
    }

    public record LoginResponse(String token, AuthUser user) {
    }

    public record AuthUser(UUID id, String name, String email) {
    }

    private boolean isValidCpfCnpj(String value) {
        String digits = value == null ? "" : value.replaceAll("\\D", "");
        return switch (digits.length()) {
            case 11 -> isValidCpf(digits);
            case 14 -> isValidCnpj(digits);
            default -> false;
        };
    }

    private boolean isValidCpf(String digits) {
        if (hasRepeatedDigits(digits)) {
            return false;
        }

        return Character.digit(digits.charAt(9), 10) == cpfCheckDigit(digits, 9)
            && Character.digit(digits.charAt(10), 10) == cpfCheckDigit(digits, 10);
    }

    private int cpfCheckDigit(String digits, int size) {
        int sum = 0;
        for (int index = 0; index < size; index++) {
            sum += Character.digit(digits.charAt(index), 10) * (size + 1 - index);
        }
        int rest = (sum * 10) % 11;
        return rest == 10 ? 0 : rest;
    }

    private boolean isValidCnpj(String digits) {
        if (hasRepeatedDigits(digits)) {
            return false;
        }

        return Character.digit(digits.charAt(12), 10) == cnpjCheckDigit(digits, new int[] {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2})
            && Character.digit(digits.charAt(13), 10) == cnpjCheckDigit(digits, new int[] {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2});
    }

    private int cnpjCheckDigit(String digits, int[] weights) {
        int sum = 0;
        for (int index = 0; index < weights.length; index++) {
            sum += Character.digit(digits.charAt(index), 10) * weights[index];
        }
        int rest = sum % 11;
        return rest < 2 ? 0 : 11 - rest;
    }

    private boolean hasRepeatedDigits(String digits) {
        return digits.chars().allMatch(digit -> digit == digits.charAt(0));
    }
}
