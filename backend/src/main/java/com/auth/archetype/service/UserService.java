package com.auth.archetype.service;

import java.util.List;
import java.util.Map;

import com.auth.archetype.dto.UserDto;
import com.auth.archetype.model.User;

public interface UserService {
    
    /**
     * Get all users
     * 
     * @return list of all users
     */
    List<UserDto> getAllUsers();
    
    /**
     * Get user by ID
     * 
     * @param id user ID
     * @return user data
     */
    UserDto getUserById(String id);
    
    /**
     * Get user by username
     * 
     * @param username username
     * @return user data
     */
    User getUserByUsername(String username);
    
    /**
     * Create a new user
     * 
     * @param userDto user data
     * @return created user
     */
    UserDto createUser(UserDto userDto);
    
    /**
     * Update an existing user
     * 
     * @param id user ID
     * @param userDto updated user data
     * @return updated user
     */
    UserDto updateUser(String id, UserDto userDto);
    
    /**
     * Delete a user
     * 
     * @param id user ID
     */
    void deleteUser(String id);
    
    /**
     * Reset a user's password
     * 
     * @param id user ID
     * @param newPassword new password
     */
    void resetPassword(String id, String newPassword);
    
    /**
     * Toggle biometric authentication for a user
     * 
     * @param id user ID
     * @param enabled whether biometric authentication should be enabled
     * @return updated user
     */
    UserDto toggleBiometric(String id, boolean enabled);
    
    /**
     * Get user statistics
     * 
     * @return map of statistics
     */
    Map<String, Long> getUserStats();
    
    /**
     * Get current user's activity information
     * 
     * @return map of activity data
     */
    Map<String, Object> getUserActivity();
    
    /**
     * Save user changes to persistent storage
     * 
     * @param user user to save
     * @return saved user
     */
    User saveUser(User user);
}
