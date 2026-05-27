package com.amilcartrucking.backend.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class TicketDTO {
    private Long id;
    private Long truckId;
    private String truckNumber;
    private Long driverId;
    private String driverName;
    private String ticketNumber;
    private LocalDate ticketDate;
    private BigDecimal quantity;
    private BigDecimal payAmount;
    private BigDecimal payRate;
    // Named without "is" prefix so Jackson serializes as "fuelSurcharge" / "edited"
    private boolean fuelSurcharge;
    private boolean edited;
}
