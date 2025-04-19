package com.auth.archetype.security;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.auth.archetype.model.User;
import com.auth.archetype.repository.FileUserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomUserDetailsService implements UserDetailsService {

    private final FileUserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.error("User not found with username: {}", username);
                    return new UsernameNotFoundException("User not found with username: " + username);
                });
                
        log.debug("Found user: {}", username);
        return UserPrincipal.create(user);
    }
    
    public UserDetails loadUserById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("User not found with id: {}", id);
                    return new UsernameNotFoundException("User not found with id: " + id);
                });
                
        return UserPrincipal.create(user);
    }
}