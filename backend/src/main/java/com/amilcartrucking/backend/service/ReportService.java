package com.amilcartrucking.backend.service;

import com.amilcartrucking.backend.dto.*;
import com.amilcartrucking.backend.model.*;
import com.amilcartrucking.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final UploadedReportRepository reportRepo;
    private final ExtractedTicketRepository ticketRepo;
    private final ReportTotalRepository totalRepo;
    private final TruckRepository truckRepo;

    public List<ReportSummaryDTO> getAllReports() {
        return reportRepo.findAllByOrderByUploadDateDesc()
            .stream()
            .map(this::toSummary)
            .collect(Collectors.toList());
    }

    public ReportDetailDTO getReportDetail(Long reportId) {
        UploadedReport report = reportRepo.findById(reportId)
            .orElseThrow(() -> new NoSuchElementException("Report not found: " + reportId));

        List<ExtractedTicket> allTickets = ticketRepo.findByReportId(reportId);
        List<ReportTotal> allTotals = totalRepo.findByReportId(reportId);

        // Group tickets by truck
        Map<Long, List<ExtractedTicket>> byTruck = allTickets.stream()
            .collect(Collectors.groupingBy(t -> t.getTruck().getId()));

        Map<Long, ReportTotal> totalByTruck = allTotals.stream()
            .collect(Collectors.toMap(rt -> rt.getTruck().getId(), rt -> rt));

        List<TruckGroupDTO> truckGroups = new ArrayList<>();
        for (Map.Entry<Long, List<ExtractedTicket>> entry : byTruck.entrySet()) {
            Long truckId = entry.getKey();
            List<ExtractedTicket> tickets = entry.getValue();
            Truck truck = tickets.get(0).getTruck();
            ReportTotal total = totalByTruck.get(truckId);

            TruckGroupDTO group = new TruckGroupDTO();
            group.setTruckId(truckId);
            group.setTruckNumber(truck.getTruckNumber());

            Driver driver = (total != null) ? total.getDriver() : null;
            if (driver == null && !tickets.isEmpty()) driver = tickets.get(0).getDriver();
            if (driver != null) {
                group.setDriverId(driver.getId());
                group.setDriverName(driver.getName());
            }

            group.setRegularTickets(tickets.stream()
                .filter(t -> !t.isFuelSurcharge())
                .map(this::toTicketDto)
                .collect(Collectors.toList()));

            group.setFuelTickets(tickets.stream()
                .filter(ExtractedTicket::isFuelSurcharge)
                .map(this::toTicketDto)
                .collect(Collectors.toList()));

            if (total != null) {
                group.setMainTotal(total.getMainTotal());
                group.setFuelTotal(total.getFuelTotal());
                group.setDriverPercentage(total.getDriverPercentage());
                group.setIncludeFuelInTotal(total.isIncludeFuelInTotal());
                group.setDriverPay(total.getDriverPay());
                group.setHasGeneratedPdf(total.getGeneratedPdfPath() != null);
            } else {
                group.setDriverPercentage(new BigDecimal("33.00"));
            }

            truckGroups.add(group);
        }

        truckGroups.sort(Comparator.comparing(TruckGroupDTO::getTruckNumber));

        ReportDetailDTO detail = new ReportDetailDTO();
        detail.setId(report.getId());
        detail.setOriginalFilename(report.getOriginalFilename());
        detail.setWeekOf(report.getWeekOf());
        detail.setUploadDate(report.getUploadDate());
        detail.setStatus(report.getStatus());
        detail.setTrucks(truckGroups);
        return detail;
    }

    @Transactional
    public void deleteReport(Long reportId) {
        UploadedReport report = reportRepo.findById(reportId)
            .orElseThrow(() -> new NoSuchElementException("Report not found: " + reportId));
        ticketRepo.deleteByReportId(reportId);
        totalRepo.deleteByReportId(reportId);
        reportRepo.delete(report);
    }

    private ReportSummaryDTO toSummary(UploadedReport report) {
        ReportSummaryDTO dto = new ReportSummaryDTO();
        dto.setId(report.getId());
        dto.setOriginalFilename(report.getOriginalFilename());
        dto.setWeekOf(report.getWeekOf());
        dto.setUploadDate(report.getUploadDate());
        dto.setStatus(report.getStatus());
        long truckCount = totalRepo.findByReportId(report.getId()).size();
        dto.setTruckCount((int) truckCount);
        return dto;
    }

    private TicketDTO toTicketDto(ExtractedTicket t) {
        TicketDTO dto = new TicketDTO();
        dto.setId(t.getId());
        dto.setTruckId(t.getTruck().getId());
        dto.setTruckNumber(t.getTruck().getTruckNumber());
        if (t.getDriver() != null) {
            dto.setDriverId(t.getDriver().getId());
            dto.setDriverName(t.getDriver().getName());
        }
        dto.setTicketNumber(t.getTicketNumber());
        dto.setTicketDate(t.getTicketDate());
        dto.setQuantity(t.getQuantity());
        dto.setPayAmount(t.getPayAmount());
        dto.setPayRate(t.getPayRate());
        dto.setFuelSurcharge(t.isFuelSurcharge());
        dto.setEdited(t.isEdited());
        return dto;
    }
}
