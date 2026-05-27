package com.amilcartrucking.backend.service;

import com.amilcartrucking.backend.config.FileStorageConfig;
import com.amilcartrucking.backend.dto.*;
import com.amilcartrucking.backend.model.*;
import com.amilcartrucking.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UploadService {

    private final FileStorageConfig storageConfig;
    private final PythonServiceClient pythonClient;
    private final UploadedReportRepository reportRepo;
    private final ExtractedTicketRepository ticketRepo;
    private final TruckRepository truckRepo;
    private final ReportTotalRepository totalRepo;

    @Transactional
    public ReportSummaryDTO upload(MultipartFile file) throws Exception {
        // 1. Save file to disk
        String uuid = UUID.randomUUID().toString();
        String storedFilename = uuid + ".pdf";
        Path dest = storageConfig.getUploadPath().resolve("pdfs").resolve(storedFilename);
        file.transferTo(dest.toFile());
        log.info("Saved uploaded PDF to {}", dest);

        // 2. Create DB record
        UploadedReport report = new UploadedReport();
        report.setOriginalFilename(file.getOriginalFilename());
        report.setStoredFilename(storedFilename);
        report.setFilePath(dest.toString());
        report.setStatus(UploadedReport.ReportStatus.UPLOADED);
        report = reportRepo.save(report);

        // 3. Call Python parser
        ParseResultDTO parseResult = pythonClient.parsePdf(dest.toFile());
        log.info("Parser returned {} truck sections, {} errors",
            parseResult.getTrucks() != null ? parseResult.getTrucks().size() : 0,
            parseResult.getParseErrors() != null ? parseResult.getParseErrors().size() : 0);

        if (parseResult.getParseErrors() != null && !parseResult.getParseErrors().isEmpty()) {
            log.warn("Parser errors: {}", parseResult.getParseErrors());
        }

        // 4. Persist trucks and tickets
        LocalDate earliestDate = null;
        List<TruckSectionDTO> sections = parseResult.getTrucks() != null ? parseResult.getTrucks() : List.of();

        for (TruckSectionDTO section : sections) {
            String truckNumber = section.getTruckNumber().toUpperCase();

            Truck truck = truckRepo.findByTruckNumber(truckNumber).orElseGet(() -> {
                Truck t = new Truck();
                t.setTruckNumber(truckNumber);
                return truckRepo.save(t);
            });

            List<ParsedTicketDTO> tickets = section.getTickets() != null ? section.getTickets() : List.of();
            for (ParsedTicketDTO dto : tickets) {
                ExtractedTicket ticket = new ExtractedTicket();
                ticket.setReport(report);
                ticket.setTruck(truck);
                ticket.setTicketNumber(dto.getTicketNumber());

                if (dto.getTicketDate() != null && !dto.getTicketDate().isBlank()) {
                    LocalDate ticketDate = LocalDate.parse(dto.getTicketDate());
                    ticket.setTicketDate(ticketDate);
                    if (earliestDate == null || ticketDate.isBefore(earliestDate)) {
                        earliestDate = ticketDate;
                    }
                }

                ticket.setQuantity(dto.getQuantity() != null ? BigDecimal.valueOf(dto.getQuantity()) : null);
                ticket.setPayAmount(dto.getPayAmount() != null ? BigDecimal.valueOf(dto.getPayAmount()) : null);
                ticket.setPayRate(dto.getPayRate() != null ? BigDecimal.valueOf(dto.getPayRate()) : null);
                ticket.setFuelSurcharge(dto.isFuelSurcharge());
                ticketRepo.save(ticket);
            }

            // Create empty ReportTotal for this truck (driver assigned later)
            ReportTotal total = new ReportTotal();
            total.setReport(report);
            total.setTruck(truck);
            totalRepo.save(total);
        }

        // 5. Set weekOf to Monday of the earliest ticket date's week
        if (earliestDate != null) {
            LocalDate monday = earliestDate.with(java.time.DayOfWeek.MONDAY);
            report.setWeekOf(monday);
        }

        report.setStatus(UploadedReport.ReportStatus.PARSED);
        report = reportRepo.save(report);

        // Build summary DTO
        ReportSummaryDTO summary = new ReportSummaryDTO();
        summary.setId(report.getId());
        summary.setOriginalFilename(report.getOriginalFilename());
        summary.setWeekOf(report.getWeekOf());
        summary.setUploadDate(report.getUploadDate());
        summary.setStatus(report.getStatus());
        summary.setTruckCount(sections.size());
        return summary;
    }
}
