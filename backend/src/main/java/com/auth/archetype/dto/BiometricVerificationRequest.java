package com.auth.archetype.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BiometricVerificationRequest {
    
    @NotBlank(message = "Username cannot be blank")
    private String username;
    
    private String biometricType;
    
    private String deviceId;
    
    // This would contain credential information in a real application
    // For this demo, we're simplifying the biometric verification
    private String credentialData;
}
