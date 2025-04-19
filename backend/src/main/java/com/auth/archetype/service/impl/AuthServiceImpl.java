package com.auth.archetype.service.impl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.auth.archetype.dto.AuthResponse;
import com.auth.archetype.dto.LoginRequest;
import com.auth.archetype.dto.RegisterRequest;
import com.auth.archetype.dto.UserDto;
import com.auth.archetype.exception.AuthException;
import com.auth.archetype.model.User;
import com.auth.archetype.repository.FileUserRepository;
import com.auth.archetype.security.JwtTokenProvider;
import com.auth.archetype.security.UserPrincipal;
import com.auth.archetype.service.AuthService;
import com.auth.archetype.service.UserService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final FileUserRepository userRepository;
    private final UserService userService;
    
    @Override
    public AuthResponse register(RegisterRequest registerRequest) {
        // Check if username is already taken
        if (existsByUsername(registerRequest.getUsername())) {
            throw new AuthException("Username is already taken");
        }
        
        // Check if email is already registered
        if (existsByEmail(registerRequest.getEmail())) {
            throw new AuthException("Email is already registered");
        }
        
        // Default to USER role if not specified
        List<String> roles = registerRequest.getRoles();
        if (roles == null || roles.isEmpty()) {
            roles = Collections.singletonList("USER");
        }
        
        // Create and save the new user
        User user = User.createNew(
            registerRequest.getUsername(),
            passwordEncoder.encode(registerRequest.getPassword()),
            registerRequest.getFirstName(),
            registerRequest.getLastName(),
            registerRequest.getEmail(),
            roles,
            registerRequest.isBiometricEnabled()
        );
        
        user = userRepository.save(user);
        log.info("User registered successfully: {}", user.getUsername());
        
        // Map to DTO for response
        UserDto userDto = mapUserToDto(user);
        
        // Generate tokens
        String accessToken = tokenProvider.generateToken(user);
        String refreshToken = tokenProvider.generateRefreshToken(user);
        
        return AuthResponse.success(accessToken, refreshToken, userDto);
    }
    
    @Override
    public AuthResponse login(LoginRequest loginRequest) {
        try {
            // Authenticate with username and password
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    loginRequest.getUsername(),
                    loginRequest.getPassword()
                )
            );
            
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            // Get user details
            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
            User user = userService.getUserByUsername(userPrincipal.getUsername());
            
            // Check if biometric authentication is required
            if (user.isBiometricEnabled()) {
                // Return a response indicating biometric verification is needed
                return AuthResponse.requiresBiometric(
                    generateBiometricChallenge(user.getUsername()),
                    mapUserToDto(user)
                );
            }
            
            // Update login info
            user.updateLoginInfo("0.0.0.0", "PASSWORD"); // IP would come from request in a real app
            userRepository.save(user);
            
            // Generate tokens
            String accessToken = tokenProvider.generateToken(user);
            String refreshToken = tokenProvider.generateRefreshToken(user);
            
            return AuthResponse.success(accessToken, refreshToken, mapUserToDto(user));
        } catch (Exception e) {
            // Handle authentication failure
            log.error("Login failed for user: {}", loginRequest.getUsername(), e);
            
            // Increment failed attempts
            try {
                User user = userService.getUserByUsername(loginRequest.getUsername());
                user.incrementFailedLoginAttempts();
                userRepository.save(user);
            } catch (Exception ex) {
                // User not found, just ignore
            }
            
            throw new AuthException("Invalid username or password");
        }
    }
    
    @Override
    public AuthResponse refreshToken() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AuthException("Not authenticated");
        }
        
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        User user = userService.getUserByUsername(userPrincipal.getUsername());
        
        // Generate new tokens
        String accessToken = tokenProvider.generateToken(user);
        String refreshToken = tokenProvider.generateRefreshToken(user);
        
        return AuthResponse.success(accessToken, refreshToken, mapUserToDto(user));
    }
    
    @Override
    public void logout() {
        // In a stateless JWT-based auth system, there's not much to do server-side for logout
        // The client should discard the tokens
        // If you were tracking tokens or sessions, you'd invalidate them here
        
        // Clear security context
        SecurityContextHolder.clearContext();
    }
    
    @Override
    public boolean existsByUsername(String username) {
        return userRepository.findByUsername(username).isPresent();
    }
    
    @Override
    public boolean existsByEmail(String email) {
        return userRepository.findByEmail(email).isPresent();
    }
    
    // Private helper methods
    
    private UserDto mapUserToDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .roles(new ArrayList<>(user.getRoles()))
                .biometricEnabled(user.isBiometricEnabled())
                .biometricType(user.getBiometricInfo() != null ? user.getBiometricInfo().getType() : null)
                .lastLoginAt(user.getLastLoginAt())
                .lastLoginMethod(user.getLastLoginMethod())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
    
    private String generateBiometricChallenge(String username) {
        // In a real application, this would generate a secure challenge
        // For this demo, we'll just use a simple timestamp-based challenge
        return "challenge_" + System.currentTimeMillis() + "_" + username;
    }
}
