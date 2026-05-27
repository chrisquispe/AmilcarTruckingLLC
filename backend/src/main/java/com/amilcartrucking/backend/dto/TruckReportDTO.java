package com.amilcartrucking.backend.dto;

import com.amilcartrucking.backend.model.UploadedReport.ReportStatus;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class TruckReportDTO {
    private Long reportId;
    private String originalFilename;
    private LocalDate weekOf;
    private LocalDateTime uploadDate;
    private ReportStatus status;
    private String driverName;
    private BigDecimal mainTotal;
    private BigDecimal fuelTotal;
    private BigDecimal driverPay;
    private BigDecimal driverPercentage;
    private boolean hasGeneratedPdf;
}
