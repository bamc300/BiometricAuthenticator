package com.auth.archetype.model;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BiometricInfo {
    
    private String type; // "fingerprint", "face", "device-password"
    private String deviceId;
    private String publicKeyId;
    private String publicKey; // Stored credential for verification
    
    // For simulating webauthn/biometric credentials
    private String challenge;
    
    private LocalDateTime enrolledAt;
    private LocalDateTime lastUsedAt;
    private int usageCount;
    
    public void incrementUsage() {
        this.usageCount++;
        this.lastUsedAt = LocalDateTime.now();
    }
    
    // Factory method for creating new biometric info
    public static BiometricInfo create(String type, String deviceId) {
        return BiometricInfo.builder()
                .type(type)
                .deviceId(deviceId)
                .enrolledAt(LocalDateTime.now())
                .usageCount(0)
                .build();
    }
    
    // Validate if this biometric info is still valid (e.g., not expired)
    public boolean isValid() {
        // Example: Biometric credentials expire after 1 year
        return enrolledAt != null && 
               enrolledAt.plusYears(1).isAfter(LocalDateTime.now());
    }
}
