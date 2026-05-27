package com.amilcartrucking.backend.service;

import com.amilcartrucking.backend.config.FileStorageConfig;
import com.amilcartrucking.backend.model.*;
import com.amilcartrucking.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GenerateService {

    private final FileStorageConfig storageConfig;
    private final PythonServiceClient pythonClient;
    private final UploadedReportRepository reportRepo;
    private final ReportTotalRepository totalRepo;
    private final ExtractedTicketRepository ticketRepo;

    @Transactional
    public void generateForTruck(Long reportId, Long truckId, String reportDate) throws IOException {
        UploadedReport report = reportRepo.findById(reportId)
            .orElseThrow(() -> new NoSuchElementException("Report not found: " + reportId));

        ReportTotal total = totalRepo.findByReportIdAndTruckId(reportId, truckId)
            .orElseThrow(() -> new NoSuchElementException("No total record for truck " + truckId));

        List<ExtractedTicket> tickets = ticketRepo.findByReportIdAndTruckId(reportId, truckId);

        // Build payload for Python
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("reportDate", (reportDate != null && !reportDate.isBlank())
            ? reportDate
            : LocalDate.now().toString());
        payload.put("driverName", total.getDriver() != null ? total.getDriver().getName() : "Unassigned");
        payload.put("truckNumber", total.getTruck().getTruckNumber());
        payload.put("mainTotal", total.getMainTotal());
        payload.put("fuelTotal", total.getFuelTotal());
        payload.put("driverPercentage", total.getDriverPercentage());
        payload.put("driverPay", total.getDriverPay());
        payload.put("includeFuelInTotal", total.isIncludeFuelInTotal());

        List<Map<String, Object>> ticketList = tickets.stream().map(t -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("ticketDate", t.getTicketDate() != null ? t.getTicketDate().toString() : null);
            m.put("ticketNumber", t.getTicketNumber());
            m.put("quantity", t.getQuantity());
            m.put("payAmount", t.getPayAmount());
            m.put("payRate", t.getPayRate());
            m.put("isFuelSurcharge", t.isFuelSurcharge());
            return m;
        }).collect(Collectors.toList());
        payload.put("tickets", ticketList);

        log.info("Calling Python /generate for report={} truck={}", reportId, truckId);
        byte[] pdfBytes = pythonClient.generatePdf(payload);

        // Save to disk
        String filename = String.format("report-%d-truck-%d.pdf", reportId, truckId);
        Path dest = storageConfig.getUploadPath().resolve("reports").resolve(filename);
        Files.write(dest, pdfBytes);
        log.info("Saved generated PDF to {}", dest);

        // Persist the path
        total.setGeneratedPdfPath(dest.toString());
        totalRepo.save(total);

        // Update report status
        report.setStatus(UploadedReport.ReportStatus.GENERATED);
        reportRepo.save(report);
    }

    public byte[] downloadForTruck(Long reportId, Long truckId) throws IOException {
        ReportTotal total = totalRepo.findByReportIdAndTruckId(reportId, truckId)
            .orElseThrow(() -> new NoSuchElementException("No total record for truck " + truckId));

        if (total.getGeneratedPdfPath() == null) {
            throw new IllegalStateException("PDF not yet generated. Call /generate first.");
        }

        return Files.readAllBytes(Paths.get(total.getGeneratedPdfPath()));
    }

    public String getGeneratedFilename(Long reportId, Long truckId) {
        ReportTotal total = totalRepo.findByReportIdAndTruckId(reportId, truckId)
            .orElseThrow(() -> new NoSuchElementException("No total record"));
        String truckNum = total.getTruck().getTruckNumber();
        String driver = total.getDriver() != null ? total.getDriver().getName().replaceAll("\\s+", "_") : "Unassigned";
        return String.format("Amilcar_%s_%s.pdf", truckNum, driver);
    }
}
