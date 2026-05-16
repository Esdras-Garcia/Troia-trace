package com.hackathon.api.user;

import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "app_user")
public class User {

    @Id
    private UUID id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, unique = true, length = 180)
    private String email;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    protected User() {
    }

    public User(String name, String email) {
        this.id = UUID.randomUUID();
        this.name = name;
        this.email = email;
        this.createdAt = OffsetDateTime.now();
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}
