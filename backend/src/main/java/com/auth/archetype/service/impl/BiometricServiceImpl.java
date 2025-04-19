package com.auth.archetype.service.impl;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.auth.archetype.dto.AuthResponse;
import com.auth.archetype.dto.BiometricVerificationRequest;
import com.auth.archetype.dto.UserDto;
import com.auth.archetype.exception.AuthException;
import com.auth.archetype.model.BiometricInfo;
import com.auth.archetype.model.User;
import com.auth.archetype.repository.FileUserRepository;
import com.auth.archetype.security.JwtTokenProvider;
import com.auth.archetype.service.BiometricService;
import com.auth.archetype.service.UserService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class BiometricServiceImpl implements BiometricService {

    private final UserService userService;
    private final JwtTokenProvider tokenProvider;
    private final FileUserRepository userRepository;
    
    // In-memory storage for challenges (would use a proper cache in production)
    private final Map<String, String> challenges = new HashMap<>();
    
    @Override
    public AuthResponse verifyBiometric(BiometricVerificationRequest request) {
        User user = userService.getUserByUsername(request.getUsername());
        
        if (!user.isBiometricEnabled()) {
            throw new AuthException("Biometric authentication not enabled for this user");
        }
        
        // In a real application, we would verify the biometric credential here
        // For this demo, we'll simulate successful verification
        
        // Update biometric usage info
        BiometricInfo bioInfo = user.getBiometricInfo();
        if (bioInfo == null) {
            // If user has biometric enabled but no info, create a default one
            bioInfo = BiometricInfo.create(
                request.getBiometricType() != null ? request.getBiometricType() : "fingerprint",
                request.getDeviceId() != null ? request.getDeviceId() : "default-device"
            );
            user.setBiometricInfo(bioInfo);
        }
        
        bioInfo.incrementUsage();
        
        // Update login info
        user.updateLoginInfo("0.0.0.0", "BIOMETRIC");
        user = userRepository.save(user);
        
        log.info("Biometric verification successful for user: {}", user.getUsername());
        
        // Generate tokens
        String token = tokenProvider.generateToken(user);
        String refreshToken = tokenProvider.generateRefreshToken(user);
        
        // Create user DTO for response
        UserDto userDto = mapUserToDto(user);
        
        return AuthResponse.success(token, refreshToken, userDto);
    }
    
    @Override
    public AuthResponse enrollBiometric(BiometricVerificationRequest request) {
        User user = userService.getUserByUsername(request.getUsername());
        
        // Create biometric info
        BiometricInfo bioInfo = BiometricInfo.create(
            request.getBiometricType(),
            request.getDeviceId() != null ? request.getDeviceId() : UUID.randomUUID().toString()
        );
        
        // In a real application, we would store the credential data here
        // For this demo, we're just simulating successful enrollment
        
        // Enable biometric for the user
        user.setBiometricEnabled(true);
        user.setBiometricInfo(bioInfo);
        user.setUpdatedAt(LocalDateTime.now());
        
        user = userRepository.save(user);
        log.info("Biometric enrollment successful for user: {}", user.getUsername());
        
        // Return success response
        UserDto userDto = mapUserToDto(user);
        
        return AuthResponse.builder()
                .user(userDto)
                .build();
    }
    
    @Override
    public User saveBiometricInfo(User user, BiometricInfo biometricInfo) {
        user.setBiometricInfo(biometricInfo);
        user.setBiometricEnabled(true);
        user.setUpdatedAt(LocalDateTime.now());
        
        return userRepository.save(user);
    }
    
    @Override
    public BiometricInfo getBiometricInfo(String username) {
        User user = userService.getUserByUsername(username);
        return user.getBiometricInfo();
    }
    
    @Override
    public String generateChallenge(String username) {
        // In a real application, this would be a secure, random challenge
        // For this demo, we'll use a simple timestamp-based challenge
        String challenge = Base64.getEncoder().encodeToString(
                (username + ":" + System.currentTimeMillis()).getBytes());
        
        // Store the challenge
        challenges.put(username, challenge);
        
        return challenge;
    }
    
    @Override
    public boolean verifyChallenge(String username, String challenge, String response) {
        // In a real application, this would verify the cryptographic response to the challenge
        // For this demo, we'll just check if the challenge matches what we stored
        
        String storedChallenge = challenges.get(username);
        
        if (storedChallenge == null) {
            return false;
        }
        
        boolean isValid = storedChallenge.equals(challenge);
        
        // Remove the challenge after verification (one-time use)
        if (isValid) {
            challenges.remove(username);
        }
        
        return isValid;
    }
    
    // Private helper methods
    
    private UserDto mapUserToDto(User user) {
        BiometricInfo bioInfo = user.getBiometricInfo();
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .roles(user.getRoles())
                .biometricEnabled(user.isBiometricEnabled())
                .biometricType(bioInfo != null ? bioInfo.getType() : null)
                .lastLoginAt(user.getLastLoginAt())
                .lastLoginMethod(user.getLastLoginMethod())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
