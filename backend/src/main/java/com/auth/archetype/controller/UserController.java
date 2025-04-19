package com.auth.archetype.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.auth.archetype.dto.UserDto;
import com.auth.archetype.model.User;
import com.auth.archetype.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserService userService;
    
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        log.info("Request to get all users");
        return ResponseEntity.ok(userService.getAllUsers());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable String id) {
        log.info("Request to get user by id: {}", id);
        return ResponseEntity.ok(userService.getUserById(id));
    }
    
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Long>> getUserStats() {
        log.info("Request to get user statistics");
        return ResponseEntity.ok(userService.getUserStats());
    }
    
    @GetMapping("/activity")
    public ResponseEntity<Map<String, Object>> getUserActivity() {
        log.info("Request to get user activity");
        return ResponseEntity.ok(userService.getUserActivity());
    }
    
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> createUser(@Valid @RequestBody UserDto userDto) {
        log.info("Request to create user: {}", userDto.getUsername());
        return ResponseEntity.ok(userService.createUser(userDto));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<UserDto> updateUser(@PathVariable String id, @Valid @RequestBody UserDto userDto) {
        log.info("Request to update user: {}", id);
        return ResponseEntity.ok(userService.updateUser(id, userDto));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        log.info("Request to delete user: {}", id);
        userService.deleteUser(id);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> resetPassword(@PathVariable String id, @RequestBody Map<String, String> passwordMap) {
        log.info("Request to reset password for user: {}", id);
        userService.resetPassword(id, passwordMap.get("password"));
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/{id}/toggle-biometric")
    public ResponseEntity<UserDto> toggleBiometric(@PathVariable String id, @RequestBody Map<String, Boolean> biometricMap) {
        log.info("Request to toggle biometric for user: {}", id);
        return ResponseEntity.ok(userService.toggleBiometric(id, biometricMap.get("enabled")));
    }
}
