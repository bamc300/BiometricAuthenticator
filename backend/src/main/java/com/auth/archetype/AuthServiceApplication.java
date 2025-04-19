package com.auth.archetype;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;

import com.auth.archetype.service.AuthService;
import com.auth.archetype.dto.RegisterRequest;
import com.auth.archetype.util.FileStorageUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.Arrays;
import java.util.List;

@SpringBootApplication
@RequiredArgsConstructor
@Slf4j
public class AuthServiceApplication {

    private final Environment env;
    private final AuthService authService;
    private final FileStorageUtil fileStorageUtil;
    
    public static void main(String[] args) {
        SpringApplication.run(AuthServiceApplication.class, args);
    }
    
    @EventListener(ApplicationReadyEvent.class)
    public void init() {
        // Ensure storage directories exist
        fileStorageUtil.initStorageDirectories();
        
        // Create default admin user if it doesn't exist
        createDefaultAdminUser();
        
        // Log application startup information
        logApplicationStartup();
    }
    
    private void createDefaultAdminUser() {
        String username = env.getProperty("app.admin.username");
        
        if (!authService.existsByUsername(username)) {
            log.info("Creating default admin user: {}", username);
            
            RegisterRequest adminUser = RegisterRequest.builder()
                .username(username)
                .password(env.getProperty("app.admin.password"))
                .firstName(env.getProperty("app.admin.firstName"))
                .lastName(env.getProperty("app.admin.lastName"))
                .email(env.getProperty("app.admin.email"))
                .roles(List.of("ADMIN", "USER"))
                .biometricEnabled(false)
                .build();
                
            authService.register(adminUser);
            log.info("Default admin user created successfully");
        } else {
            log.info("Default admin user already exists");
        }
    }
    
    private void logApplicationStartup() {
        String protocol = "http";
        String serverPort = env.getProperty("server.port");
        String contextPath = env.getProperty("server.servlet.context-path", "/");
        String hostAddress = "localhost";
        
        log.info("\n----------------------------------------------------------\n\t" +
                "Application '{}' is running! Access URLs:\n\t" +
                "Local: \t\t{}://{}:{}{}\n\t" +
                "Profile(s): \t{}\n----------------------------------------------------------",
            env.getProperty("spring.application.name"),
            protocol,
            hostAddress,
            serverPort,
            contextPath,
            Arrays.toString(env.getActiveProfiles()));
    }
}
