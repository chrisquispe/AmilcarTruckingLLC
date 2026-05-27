package com.amilcartrucking.backend.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class FileStorageConfig {

    @Value("${app.upload-dir}")
    private String uploadDir;

    // Always absolute — resolves relative paths against the JVM working directory
    private Path uploadPath;

    @PostConstruct
    public void init() throws IOException {
        uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(uploadPath.resolve("pdfs"));
        Files.createDirectories(uploadPath.resolve("reports"));
    }

    public Path getUploadPath() {
        return uploadPath;
    }

    // Keep for backward compat with GenerateService string usage
    public String getUploadDir() {
        return uploadPath.toString();
    }
}
