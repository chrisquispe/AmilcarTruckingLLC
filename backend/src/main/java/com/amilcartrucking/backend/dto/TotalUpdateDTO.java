package com.amilcartrucking.backend.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class TotalUpdateDTO {
    private BigDecimal driverPercentage;
    private Boolean includeFuelInTotal;
}
