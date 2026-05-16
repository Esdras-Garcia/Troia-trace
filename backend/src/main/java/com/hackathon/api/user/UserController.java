package com.hackathon.api.user;

import java.net.URI;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository users;

    public UserController(UserRepository users) {
        this.users = users;
    }

    @GetMapping
    List<UserResponse> list() {
        return users.findAll().stream()
            .map(UserResponse::from)
            .toList();
    }

    @PostMapping
    ResponseEntity<UserResponse> create(@Valid @RequestBody CreateUserRequest request) {
        User user = users.save(new User(request.name(), request.email()));
        return ResponseEntity
            .created(URI.create("/api/users/" + user.getId()))
            .body(UserResponse.from(user));
    }

    public record CreateUserRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Email @Size(max = 180) String email
    ) {
    }

    public record UserResponse(UUID id, String name, String email, OffsetDateTime createdAt) {
        static UserResponse from(User user) {
            return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getCreatedAt());
        }
    }
}
