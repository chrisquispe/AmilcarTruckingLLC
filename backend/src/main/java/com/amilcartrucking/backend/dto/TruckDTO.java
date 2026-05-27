package com.amilcartrucking.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TruckDTO {
    private Long id;
    private String truckNumber;
    private LocalDateTime createdAt;
}
