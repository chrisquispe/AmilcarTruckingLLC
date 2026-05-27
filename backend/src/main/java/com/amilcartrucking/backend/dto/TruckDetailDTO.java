package com.amilcartrucking.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class TruckDetailDTO {
    private Long id;
    private String truckNumber;
    private int reportCount;
    private List<TruckReportDTO> reports;
}
