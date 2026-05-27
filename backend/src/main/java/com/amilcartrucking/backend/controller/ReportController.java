package com.amilcartrucking.backend.controller;

import com.amilcartrucking.backend.dto.*;
import com.amilcartrucking.backend.service.CalculationService;
import com.amilcartrucking.backend.service.GenerateService;
import com.amilcartrucking.backend.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final CalculationService calculationService;
    private final GenerateService generateService;

    @GetMapping
    public List<ReportSummaryDTO> listReports() {
        return reportService.getAllReports();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getReport(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(reportService.getReportDetail(id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReport(@PathVariable Long id) {
        try {
            reportService.deleteReport(id);
            return ResponseEntity.ok(Map.of("message", "Report deleted"));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/trucks/{truckId}/driver")
    public ResponseEntity<?> assignDriver(
            @PathVariable Long id,
            @PathVariable Long truckId,
            @RequestBody DriverAssignmentDTO dto) {
        try {
            calculationService.assignDriver(id, truckId, dto.getDriverId());
            return ResponseEntity.ok(Map.of("message", "Driver assigned"));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/totals/{truckId}")
    public ResponseEntity<?> updateTotal(
            @PathVariable Long id,
            @PathVariable Long truckId,
            @RequestBody TotalUpdateDTO dto) {
        try {
            TruckGroupDTO result = calculationService.updateAndRecalculate(
                id, truckId, dto.getDriverPercentage(), dto.getIncludeFuelInTotal());
            return ResponseEntity.ok(result);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/calculate")
    public ResponseEntity<?> calculate(@PathVariable Long id) {
        try {
            calculationService.calculateAll(id);
            return ResponseEntity.ok(Map.of("message", "Totals recalculated"));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /** Generate PDF for one truck in this report. */
    @PostMapping("/{id}/trucks/{truckId}/generate")
    public ResponseEntity<?> generateForTruck(
            @PathVariable Long id,
            @PathVariable Long truckId,
            @RequestBody(required = false) GenerateRequestDTO dto) {
        try {
            String date = dto != null ? dto.getReportDate() : null;
            generateService.generateForTruck(id, truckId, date);
            return ResponseEntity.ok(Map.of("message", "PDF generated"));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }

    /** Download the generated PDF for one truck. */
    @GetMapping("/{id}/trucks/{truckId}/download")
    public ResponseEntity<?> downloadForTruck(
            @PathVariable Long id,
            @PathVariable Long truckId) {
        try {
            byte[] pdf = generateService.downloadForTruck(id, truckId);
            String filename = generateService.getGeneratedFilename(id, truckId);

            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(pdf);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }
}
