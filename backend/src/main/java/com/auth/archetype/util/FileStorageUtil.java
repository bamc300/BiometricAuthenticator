package com.auth.archetype.util;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class FileStorageUtil {

    @Value("${app.file.storage.path}")
    private String storagePath;
    
    @Value("${app.file.users}")
    private String usersFileName;
    
    @Value("${app.file.biometrics}")
    private String biometricsFileName;
    
    /**
     * Initialize storage directories if they don't exist
     */
    public void initStorageDirectories() {
        try {
            Path storageDir = Paths.get(storagePath);
            if (!Files.exists(storageDir)) {
                Files.createDirectories(storageDir);
                log.info("Created storage directory: {}", storageDir.toAbsolutePath());
            }
        } catch (IOException e) {
            log.error("Failed to create storage directory", e);
            throw new RuntimeException("Could not create storage directory", e);
        }
    }
    
    /**
     * Get the full path to the users file
     * 
     * @return path to users file
     */
    public String getUsersFilePath() {
        return Paths.get(storagePath, usersFileName).toString();
    }
    
    /**
     * Get the full path to the biometrics file
     * 
     * @return path to biometrics file
     */
    public String getBiometricsFilePath() {
        return Paths.get(storagePath, biometricsFileName).toString();
    }
    
    /**
     * Read a file from storage
     * 
     * @param filePath path to the file
     * @return file contents as byte array, or null if file doesn't exist
     * @throws IOException if reading fails
     */
    public byte[] readFile(String filePath) throws IOException {
        Path path = Paths.get(filePath);
        
        if (!Files.exists(path)) {
            log.info("File not found: {}", filePath);
            return null;
        }
        
        return Files.readAllBytes(path);
    }
    
    /**
     * Write data to a file
     * 
     * @param filePath path to the file
     * @param data data to write
     * @throws IOException if writing fails
     */
    public void writeFile(String filePath, byte[] data) throws IOException {
        Path path = Paths.get(filePath);
        
        // Ensure parent directory exists
        Path parentDir = path.getParent();
        if (!Files.exists(parentDir)) {
            Files.createDirectories(parentDir);
        }
        
        Files.write(path, data);
        log.debug("Wrote {} bytes to file: {}", data.length, filePath);
    }
    
    /**
     * Delete a file
     * 
     * @param filePath path to the file
     * @return true if file was deleted, false if it didn't exist
     * @throws IOException if deletion fails
     */
    public boolean deleteFile(String filePath) throws IOException {
        Path path = Paths.get(filePath);
        
        if (!Files.exists(path)) {
            log.info("File not found for deletion: {}", filePath);
            return false;
        }
        
        Files.delete(path);
        log.info("Deleted file: {}", filePath);
        return true;
    }
    
    /**
     * Check if a file exists
     * 
     * @param filePath path to the file
     * @return true if file exists, false otherwise
     */
    public boolean fileExists(String filePath) {
        return Files.exists(Paths.get(filePath));
    }
    
    /**
     * Create a backup of a file
     * 
     * @param filePath path to the file
     * @return true if backup was created, false if file didn't exist
     * @throws IOException if backup creation fails
     */
    public boolean createBackup(String filePath) throws IOException {
        Path path = Paths.get(filePath);
        
        if (!Files.exists(path)) {
            log.info("File not found for backup: {}", filePath);
            return false;
        }
        
        String backupPath = filePath + ".bak";
        Files.copy(path, Paths.get(backupPath));
        log.info("Created backup of file {} at {}", filePath, backupPath);
        return true;
    }
}
