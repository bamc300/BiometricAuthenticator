package com.auth.archetype.service.impl;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.auth.archetype.dto.UserDto;
import com.auth.archetype.exception.AuthException;
import com.auth.archetype.exception.ResourceNotFoundException;
import com.auth.archetype.model.BiometricInfo;
import com.auth.archetype.model.User;
import com.auth.archetype.repository.FileUserRepository;
import com.auth.archetype.security.UserPrincipal;
import com.auth.archetype.service.UserService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final FileUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Override
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapUserToDto)
                .collect(Collectors.toList());
    }
    
    @Override
    public UserDto getUserById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return mapUserToDto(user);
    }
    
    @Override
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
    }
    
    @Override
    public UserDto createUser(UserDto userDto) {
        // Check if username or email already exists
        if (userRepository.findByUsername(userDto.getUsername()).isPresent()) {
            throw new AuthException("Username is already taken");
        }
        
        if (userRepository.findByEmail(userDto.getEmail()).isPresent()) {
            throw new AuthException("Email is already registered");
        }
        
        // Create new user
        User user = User.createNew(
            userDto.getUsername(),
            passwordEncoder.encode(userDto.getPassword()),
            userDto.getFirstName(),
            userDto.getLastName(),
            userDto.getEmail(),
            userDto.getRoles(),
            userDto.isBiometricEnabled()
        );
        
        // Save user
        user = userRepository.save(user);
        log.info("User created: {}", user.getUsername());
        
        return mapUserToDto(user);
    }
    
    @Override
    public UserDto updateUser(String id, UserDto userDto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        
        // Check if current user has permission to update this user
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal currentUser = (UserPrincipal) auth.getPrincipal();
        
        if (!currentUser.getId().equals(id) && !currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            throw new AuthException("You don't have permission to update this user");
        }
        
        // Update basic info
        user.setFirstName(userDto.getFirstName());
        user.setLastName(userDto.getLastName());
        
        // Only admin can update roles
        if (currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            user.setRoles(userDto.getRoles());
        }
        
        // Update password if provided
        if (userDto.getPassword() != null && !userDto.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(userDto.getPassword()));
        }
        
        // Update biometric settings
        user.setBiometricEnabled(userDto.isBiometricEnabled());
        
        // Update timestamp
        user.setUpdatedAt(LocalDateTime.now());
        
        // Save changes
        user = userRepository.save(user);
        log.info("User updated: {}", user.getUsername());
        
        return mapUserToDto(user);
    }
    
    @Override
    public void deleteUser(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        
        // Check if current user is trying to delete themselves
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal currentUser = (UserPrincipal) auth.getPrincipal();
        
        if (currentUser.getId().equals(id)) {
            throw new AuthException("You cannot delete your own account");
        }
        
        userRepository.delete(user);
        log.info("User deleted: {}", user.getUsername());
    }
    
    @Override
    public void resetPassword(String id, String newPassword) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        
        userRepository.save(user);
        log.info("Password reset for user: {}", user.getUsername());
    }
    
    @Override
    public UserDto toggleBiometric(String id, boolean enabled) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        
        // Check if current user has permission
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal currentUser = (UserPrincipal) auth.getPrincipal();
        
        if (!currentUser.getId().equals(id) && !currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            throw new AuthException("You don't have permission to update this user's biometric settings");
        }
        
        user.setBiometricEnabled(enabled);
        
        // Clear biometric info if disabling
        if (!enabled && user.getBiometricInfo() != null) {
            user.setBiometricInfo(null);
        }
        
        user.setUpdatedAt(LocalDateTime.now());
        
        user = userRepository.save(user);
        log.info("Biometric authentication {} for user: {}", 
                enabled ? "enabled" : "disabled", user.getUsername());
        
        return mapUserToDto(user);
    }
    
    @Override
    public Map<String, Long> getUserStats() {
        List<User> users = userRepository.findAll();
        
        Map<String, Long> stats = new HashMap<>();
        stats.put("totalUsers", (long) users.size());
        stats.put("adminCount", users.stream().filter(u -> u.getRoles().contains("ADMIN")).count());
        stats.put("regularUserCount", users.stream().filter(u -> !u.getRoles().contains("ADMIN")).count());
        stats.put("biometricEnabledCount", users.stream().filter(User::isBiometricEnabled).count());
        
        return stats;
    }
    
    @Override
    public Map<String, Object> getUserActivity() {
        // Get current authenticated user
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal currentUser = (UserPrincipal) auth.getPrincipal();
        
        User user = getUserByUsername(currentUser.getUsername());
        
        Map<String, Object> activity = new HashMap<>();
        
        // Format last login time
        if (user.getLastLoginAt() != null) {
            activity.put("lastLogin", user.getLastLoginAt().format(
                    DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        } else {
            activity.put("lastLogin", "Never");
        }
        
        activity.put("lastLoginMethod", user.getLastLoginMethod());
        activity.put("failedAttempts", user.getFailedLoginAttempts());
        activity.put("offlineEnabled", user.isBiometricEnabled()); // We're using biometric for offline auth
        
        // Other activity info could be added here
        
        return activity;
    }
    
    @Override
    public User saveUser(User user) {
        return userRepository.save(user);
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
