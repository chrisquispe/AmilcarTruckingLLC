package com.amilcartrucking.backend.dto;

import lombok.Data;

@Data
public class GenerateRequestDTO {
    private String reportDate;  // "YYYY-MM-DD", defaults to today if null
}
