package com.amilcartrucking.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DriverCreateDTO {
    @NotBlank
    private String name;
    private boolean common = false;
}
