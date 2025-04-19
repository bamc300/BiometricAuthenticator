package com.auth.archetype.repository;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Repository;

import com.auth.archetype.exception.ResourceNotFoundException;
import com.auth.archetype.model.User;
import com.auth.archetype.util.FileStorageUtil;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Repository
@RequiredArgsConstructor
@Slf4j
public class FileUserRepository {

    private final FileStorageUtil fileStorageUtil;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
    
    private List<User> users = new ArrayList<>();
    
    @PostConstruct
    public void init() {
        loadUsersFromFile();
    }
    
    public List<User> findAll() {
        return Collections.unmodifiableList(users);
    }
    
    public Optional<User> findById(String id) {
        return users.stream()
                .filter(user -> user.getId().equals(id))
                .findFirst();
    }
    
    public Optional<User> findByUsername(String username) {
        return users.stream()
                .filter(user -> user.getUsername().equals(username))
                .findFirst();
    }
    
    public Optional<User> findByEmail(String email) {
        return users.stream()
                .filter(user -> user.getEmail().equals(email))
                .findFirst();
    }
    
    public User save(User user) {
        // Update timestamp
        user.setUpdatedAt(LocalDateTime.now());
        
        // Check if user already exists (update) or is new (create)
        boolean exists = users.stream().anyMatch(u -> u.getId().equals(user.getId()));
        
        if (exists) {
            // Update existing user
            users = users.stream()
                    .map(u -> u.getId().equals(user.getId()) ? user : u)
                    .collect(Collectors.toList());
        } else {
            // Add new user
            users.add(user);
        }
        
        // Save to file
        saveUsersToFile();
        
        return user;
    }
    
    public void delete(User user) {
        users = users.stream()
                .filter(u -> !u.getId().equals(user.getId()))
                .collect(Collectors.toList());
        
        // Save to file
        saveUsersToFile();
    }
    
    public void deleteById(String id) {
        User user = findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        
        delete(user);
    }
    
    // Private helper methods
    
    private void loadUsersFromFile() {
        try {
            byte[] data = fileStorageUtil.readFile(fileStorageUtil.getUsersFilePath());
            
            if (data != null && data.length > 0) {
                users = objectMapper.readValue(data, new TypeReference<List<User>>() {});
                log.info("Loaded {} users from file", users.size());
            } else {
                log.info("Users file is empty or doesn't exist, starting with empty list");
                users = new ArrayList<>();
            }
        } catch (IOException e) {
            log.error("Error loading users from file", e);
            users = new ArrayList<>();
        }
    }
    
    private void saveUsersToFile() {
        try {
            byte[] data = objectMapper.writeValueAsBytes(users);
            fileStorageUtil.writeFile(fileStorageUtil.getUsersFilePath(), data);
            log.info("Saved {} users to file", users.size());
        } catch (IOException e) {
            log.error("Error saving users to file", e);
        }
    }
}
