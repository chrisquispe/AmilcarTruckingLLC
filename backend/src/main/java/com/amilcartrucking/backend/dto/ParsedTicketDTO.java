package com.amilcartrucking.backend.dto;

import lombok.Data;

@Data
public class ParsedTicketDTO {
    private String truckNumber;
    private String ticketNumber;
    private String ticketDate;       // "YYYY-MM-DD"
    private Double quantity;
    private Double payRate;
    private Double payAmount;
    private boolean isFuelSurcharge;
}
