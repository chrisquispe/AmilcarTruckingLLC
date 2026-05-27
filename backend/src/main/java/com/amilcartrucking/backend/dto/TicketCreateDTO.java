package com.amilcartrucking.backend.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class TicketCreateDTO {
    private String ticketNumber;
    private LocalDate ticketDate;
    private BigDecimal quantity;
    private BigDecimal payAmount;
    private BigDecimal payRate;
    private boolean fuelSurcharge;
}
