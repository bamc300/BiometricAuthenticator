package com.auth.archetype.service;

import com.auth.archetype.dto.AuthResponse;
import com.auth.archetype.dto.LoginRequest;
import com.auth.archetype.dto.RegisterRequest;

public interface AuthService {
    
    /**
     * Register a new user
     * 
     * @param registerRequest registration data
     * @return authentication response with token
     */
    AuthResponse register(RegisterRequest registerRequest);
    
    /**
     * Authenticate a user with username and password
     * 
     * @param loginRequest login credentials
     * @return authentication response with token
     */
    AuthResponse login(LoginRequest loginRequest);
    
    /**
     * Refresh the authentication token
     * 
     * @return new authentication response with refreshed token
     */
    AuthResponse refreshToken();
    
    /**
     * Log out the current user
     */
    void logout();
    
    /**
     * Check if a username already exists
     * 
     * @param username the username to check
     * @return true if the username exists, false otherwise
     */
    boolean existsByUsername(String username);
    
    /**
     * Check if an email already exists
     * 
     * @param email the email to check
     * @return true if the email exists, false otherwise
     */
    boolean existsByEmail(String email);
}
