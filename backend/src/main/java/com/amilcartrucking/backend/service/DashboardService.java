package com.amilcartrucking.backend.service;

import com.amilcartrucking.backend.dto.DashboardDTO;
import com.amilcartrucking.backend.dto.ReportSummaryDTO;
import com.amilcartrucking.backend.model.UploadedReport;
import com.amilcartrucking.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UploadedReportRepository reportRepo;
    private final TruckRepository truckRepo;
    private final DriverRepository driverRepo;
    private final ReportTotalRepository totalRepo;

    public DashboardDTO getDashboard() {
        DashboardDTO dto = new DashboardDTO();
        dto.setTotalReports(reportRepo.count());
        dto.setActiveTrucks(truckRepo.count());
        dto.setTotalDrivers(driverRepo.count());

        // Total revenue = sum of all main_total values across all report_totals
        BigDecimal revenue = totalRepo.findAll().stream()
            .map(rt -> rt.getMainTotal() != null ? rt.getMainTotal() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTotalRevenue(revenue);

        // Recent 5 reports
        List<ReportSummaryDTO> recent = reportRepo.findAllByOrderByUploadDateDesc()
            .stream()
            .limit(5)
            .map(r -> {
                ReportSummaryDTO s = new ReportSummaryDTO();
                s.setId(r.getId());
                s.setOriginalFilename(r.getOriginalFilename());
                s.setWeekOf(r.getWeekOf());
                s.setUploadDate(r.getUploadDate());
                s.setStatus(r.getStatus());
                s.setTruckCount((int) totalRepo.findByReportId(r.getId()).size());
                return s;
            })
            .collect(Collectors.toList());
        dto.setRecentReports(recent);

        return dto;
    }
}
