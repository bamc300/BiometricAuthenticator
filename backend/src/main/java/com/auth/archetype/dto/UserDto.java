package com.auth.archetype.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    
    private String id;
    
    @NotBlank(message = "Username cannot be blank")
    @Size(min = 4, max = 50, message = "Username must be between 4 and 50 characters")
    private String username;
    
    @NotBlank(message = "First name cannot be blank")
    private String firstName;
    
    @NotBlank(message = "Last name cannot be blank")
    private String lastName;
    
    @NotBlank(message = "Email cannot be blank")
    @Email(message = "Email should be valid")
    private String email;
    
    // Password is only writeable, never returned in responses
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;
    
    private List<String> roles;
    
    private boolean biometricEnabled;
    private String biometricType;
    
    private LocalDateTime lastLoginAt;
    private String lastLoginMethod;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // For admin views only
    @JsonIgnore
    private boolean accountLocked;
    
    @JsonIgnore
    private int failedLoginAttempts;
}
