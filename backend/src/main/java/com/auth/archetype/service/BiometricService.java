package com.auth.archetype.service;

import com.auth.archetype.dto.AuthResponse;
import com.auth.archetype.dto.BiometricVerificationRequest;
import com.auth.archetype.model.BiometricInfo;
import com.auth.archetype.model.User;

public interface BiometricService {
    
    /**
     * Verify biometric authentication
     * 
     * @param request biometric verification request
     * @return authentication response
     */
    AuthResponse verifyBiometric(BiometricVerificationRequest request);
    
    /**
     * Enroll biometric credentials for a user
     * 
     * @param request biometric enrollment request
     * @return authentication response
     */
    AuthResponse enrollBiometric(BiometricVerificationRequest request);
    
    /**
     * Save biometric information for a user
     * 
     * @param user user to save biometric info for
     * @param biometricInfo biometric information
     * @return updated user
     */
    User saveBiometricInfo(User user, BiometricInfo biometricInfo);
    
    /**
     * Get biometric information for a user
     * 
     * @param username username
     * @return biometric information
     */
    BiometricInfo getBiometricInfo(String username);
    
    /**
     * Generate a challenge for biometric authentication
     * 
     * @param username username
     * @return challenge string
     */
    String generateChallenge(String username);
    
    /**
     * Verify a challenge response
     * 
     * @param username username
     * @param challenge challenge
     * @param response response
     * @return true if valid, false otherwise
     */
    boolean verifyChallenge(String username, String challenge, String response);
}
