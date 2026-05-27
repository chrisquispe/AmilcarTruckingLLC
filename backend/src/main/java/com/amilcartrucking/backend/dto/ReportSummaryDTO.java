package com.amilcartrucking.backend.dto;

import com.amilcartrucking.backend.model.UploadedReport.ReportStatus;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class ReportSummaryDTO {
    private Long id;
    private String originalFilename;
    private LocalDate weekOf;
    private LocalDateTime uploadDate;
    private ReportStatus status;
    private int truckCount;
}
