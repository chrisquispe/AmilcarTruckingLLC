package com.amilcartrucking.backend.service;

import com.amilcartrucking.backend.dto.TruckGroupDTO;
import com.amilcartrucking.backend.model.*;
import com.amilcartrucking.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class CalculationService {

    private final ReportTotalRepository totalRepo;
    private final ExtractedTicketRepository ticketRepo;
    private final UploadedReportRepository reportRepo;
    private final DriverRepository driverRepo;

    /** Assign a driver to all tickets + the ReportTotal for this truck in this report. */
    @Transactional
    public void assignDriver(Long reportId, Long truckId, Long driverId) {
        Driver driver = driverRepo.findById(driverId)
            .orElseThrow(() -> new NoSuchElementException("Driver not found: " + driverId));

        ticketRepo.findByReportIdAndTruckId(reportId, truckId)
            .forEach(t -> {
                t.setDriver(driver);
                ticketRepo.save(t);
            });

        ReportTotal total = totalRepo.findByReportIdAndTruckId(reportId, truckId)
            .orElseThrow(() -> new NoSuchElementException("No total record for this truck/report"));
        total.setDriver(driver);
        totalRepo.save(total);
    }

    /** Update percentage and/or fuel toggle for one truck, then recalculate. */
    @Transactional
    public TruckGroupDTO updateAndRecalculate(Long reportId, Long truckId,
                                               BigDecimal percentage, Boolean includeFuel) {
        ReportTotal total = totalRepo.findByReportIdAndTruckId(reportId, truckId)
            .orElseThrow(() -> new NoSuchElementException("No total record for this truck/report"));

        if (percentage != null) total.setDriverPercentage(percentage);
        if (includeFuel != null) total.setIncludeFuelInTotal(includeFuel);

        total = recalculate(total, reportId, truckId);
        return toGroupDTO(total);
    }

    /** Recalculate all truck totals for a report. */
    @Transactional
    public void calculateAll(Long reportId) {
        List<ReportTotal> totals = totalRepo.findByReportId(reportId);
        totals.forEach(t -> recalculate(t, reportId, t.getTruck().getId()));

        reportRepo.findById(reportId).ifPresent(r -> {
            r.setStatus(UploadedReport.ReportStatus.REVIEWED);
            reportRepo.save(r);
        });
    }

    // -------------------------------------------------------------------------

    private ReportTotal recalculate(ReportTotal total, Long reportId, Long truckId) {
        List<ExtractedTicket> tickets = ticketRepo.findByReportIdAndTruckId(reportId, truckId);

        BigDecimal mainTotal = tickets.stream()
            .filter(t -> !t.isFuelSurcharge())
            .map(t -> t.getPayAmount() != null ? t.getPayAmount() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal fuelTotal = tickets.stream()
            .filter(ExtractedTicket::isFuelSurcharge)
            .map(t -> t.getPayAmount() != null ? t.getPayAmount() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal effective = total.isIncludeFuelInTotal()
            ? mainTotal.add(fuelTotal)
            : mainTotal;

        BigDecimal pct = total.getDriverPercentage() != null
            ? total.getDriverPercentage()
            : new BigDecimal("33.00");

        BigDecimal driverPay = effective
            .multiply(pct)
            .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

        total.setMainTotal(mainTotal.setScale(2, RoundingMode.HALF_UP));
        total.setFuelTotal(fuelTotal.setScale(2, RoundingMode.HALF_UP));
        total.setDriverPay(driverPay);
        return totalRepo.save(total);
    }

    private TruckGroupDTO toGroupDTO(ReportTotal t) {
        TruckGroupDTO dto = new TruckGroupDTO();
        dto.setTruckId(t.getTruck().getId());
        dto.setTruckNumber(t.getTruck().getTruckNumber());
        if (t.getDriver() != null) {
            dto.setDriverId(t.getDriver().getId());
            dto.setDriverName(t.getDriver().getName());
        }
        dto.setMainTotal(t.getMainTotal());
        dto.setFuelTotal(t.getFuelTotal());
        dto.setDriverPercentage(t.getDriverPercentage());
        dto.setIncludeFuelInTotal(t.isIncludeFuelInTotal());
        dto.setDriverPay(t.getDriverPay());
        return dto;
    }
}
