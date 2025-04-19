#!/bin/bash

echo "Starting Spring Boot application..."

# Create data directory for user storage
mkdir -p backend/data

# Change to backend directory
cd backend

# Start Spring Boot application
echo "Starting Spring Boot application on port 8000..."
mvn spring-boot:run -DskipTests