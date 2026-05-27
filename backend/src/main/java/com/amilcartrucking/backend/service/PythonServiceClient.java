package com.amilcartrucking.backend.service;

import com.amilcartrucking.backend.dto.ParseResultDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.io.File;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PythonServiceClient {

    private final RestTemplate restTemplate;

    @Value("${app.python-service-url}")
    private String pythonServiceUrl;

    public ParseResultDTO parsePdf(File pdfFile) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new FileSystemResource(pdfFile));

        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<ParseResultDTO> response = restTemplate.exchange(
                pythonServiceUrl + "/parse",
                HttpMethod.POST,
                request,
                ParseResultDTO.class
            );
            return response.getBody();
        } catch (Exception e) {
            log.error("Failed to call Python parse service: {}", e.getMessage());
            throw new RuntimeException("PDF parsing service unavailable: " + e.getMessage(), e);
        }
    }

    public byte[] generatePdf(Map<String, Object> reportData) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(reportData, headers);

        try {
            ResponseEntity<byte[]> response = restTemplate.exchange(
                pythonServiceUrl + "/generate",
                HttpMethod.POST,
                request,
                byte[].class
            );
            return response.getBody();
        } catch (Exception e) {
            log.error("Failed to call Python generate service: {}", e.getMessage());
            throw new RuntimeException("PDF generation service unavailable: " + e.getMessage(), e);
        }
    }
}
