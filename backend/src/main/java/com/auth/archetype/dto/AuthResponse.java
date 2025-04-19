package com.auth.archetype.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    
    private String token;
    private String refreshToken;
    private String tokenType;
    private long expiresIn;
    private UserDto user;
    
    private boolean requiresBiometric;
    private String biometricChallenge;
    
    // Static factory methods for common response types
    public static AuthResponse success(String token, String refreshToken, UserDto user) {
        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(86400) // 24 hours in seconds
                .user(user)
                .requiresBiometric(false)
                .build();
    }
    
    public static AuthResponse requiresBiometric(String biometricChallenge, UserDto user) {
        return AuthResponse.builder()
                .tokenType("Bearer")
                .requiresBiometric(true)
                .biometricChallenge(biometricChallenge)
                .user(user)
                .build();
    }
}
