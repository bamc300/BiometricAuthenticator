package com.auth.archetype.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.auth.archetype.dto.AuthResponse;
import com.auth.archetype.dto.BiometricVerificationRequest;
import com.auth.archetype.dto.LoginRequest;
import com.auth.archetype.dto.RegisterRequest;
import com.auth.archetype.service.AuthService;
import com.auth.archetype.service.BiometricService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;
    private final BiometricService biometricService;
    
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest registerRequest) {
        log.info("Registration request for username: {}", registerRequest.getUsername());
        return ResponseEntity.ok(authService.register(registerRequest));
    }
    
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        log.info("Login request for username: {}", loginRequest.getUsername());
        return ResponseEntity.ok(authService.login(loginRequest));
    }
    
    @PostMapping("/biometric/verify")
    public ResponseEntity<AuthResponse> verifyBiometric(@Valid @RequestBody BiometricVerificationRequest request) {
        log.info("Biometric verification request for username: {}", request.getUsername());
        return ResponseEntity.ok(biometricService.verifyBiometric(request));
    }
    
    @PostMapping("/biometric/enroll")
    public ResponseEntity<AuthResponse> enrollBiometric(@Valid @RequestBody BiometricVerificationRequest request) {
        log.info("Biometric enrollment request for username: {}", request.getUsername());
        return ResponseEntity.ok(biometricService.enrollBiometric(request));
    }
    
    @PostMapping("/refresh-token")
    public ResponseEntity<AuthResponse> refreshToken() {
        log.info("Token refresh request");
        return ResponseEntity.ok(authService.refreshToken());
    }
    
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        log.info("Logout request");
        authService.logout();
        return ResponseEntity.ok().build();
    }
}
