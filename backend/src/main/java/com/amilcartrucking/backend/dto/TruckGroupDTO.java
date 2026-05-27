package com.amilcartrucking.backend.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class TruckGroupDTO {
    private Long truckId;
    private String truckNumber;
    private Long driverId;
    private String driverName;
    private List<TicketDTO> regularTickets;
    private List<TicketDTO> fuelTickets;
    private BigDecimal mainTotal;
    private BigDecimal fuelTotal;
    private BigDecimal driverPercentage;
    private boolean includeFuelInTotal;
    private BigDecimal driverPay;
    private boolean hasGeneratedPdf;
}
