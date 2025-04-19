package com.auth.archetype.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    
    private String id;
    private String username;
    private String firstName;
    private String lastName;
    private String email;
    
    @JsonIgnore
    private String password;
    
    @Builder.Default
    private List<String> roles = new ArrayList<>();
    
    private boolean biometricEnabled;
    private BiometricInfo biometricInfo;
    
    private String lastLoginIp;
    private LocalDateTime lastLoginAt;
    private String lastLoginMethod;
    
    @Builder.Default
    private int failedLoginAttempts = 0;
    
    private boolean accountLocked;
    private LocalDateTime accountLockedAt;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Helper methods
    public static User createNew(String username, String password, String firstName, String lastName, String email, 
                                List<String> roles, boolean biometricEnabled) {
        LocalDateTime now = LocalDateTime.now();
        return User.builder()
                .id(UUID.randomUUID().toString())
                .username(username)
                .password(password)
                .firstName(firstName)
                .lastName(lastName)
                .email(email)
                .roles(roles)
                .biometricEnabled(biometricEnabled)
                .createdAt(now)
                .updatedAt(now)
                .build();
    }
    
    public void updateLoginInfo(String loginIp, String loginMethod) {
        this.lastLoginIp = loginIp;
        this.lastLoginAt = LocalDateTime.now();
        this.lastLoginMethod = loginMethod;
        this.failedLoginAttempts = 0;
    }
    
    public void incrementFailedLoginAttempts() {
        this.failedLoginAttempts++;
        if (this.failedLoginAttempts >= 5) {
            this.accountLocked = true;
            this.accountLockedAt = LocalDateTime.now();
        }
    }
    
    public void unlockAccount() {
        this.accountLocked = false;
        this.accountLockedAt = null;
        this.failedLoginAttempts = 0;
    }
    
    public boolean hasRole(String role) {
        return roles != null && roles.contains(role);
    }
}
