package com.amilcartrucking.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class TruckSectionDTO {
    private String truckNumber;
    private List<ParsedTicketDTO> tickets;
}
