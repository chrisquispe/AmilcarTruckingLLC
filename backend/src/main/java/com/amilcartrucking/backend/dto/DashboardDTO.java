package com.amilcartrucking.backend.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class DashboardDTO {
    private long totalReports;
    private long activeTrucks;
    private long totalDrivers;
    private BigDecimal totalRevenue;
    private List<ReportSummaryDTO> recentReports;
}
