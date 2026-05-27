package com.amilcartrucking.backend.controller;

import com.amilcartrucking.backend.dto.TruckDetailDTO;
import com.amilcartrucking.backend.dto.TruckDTO;
import com.amilcartrucking.backend.dto.TruckReportDTO;
import com.amilcartrucking.backend.model.ReportTotal;
import com.amilcartrucking.backend.model.Truck;
import com.amilcartrucking.backend.repository.ReportTotalRepository;
import com.amilcartrucking.backend.repository.TruckRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/trucks")
@RequiredArgsConstructor
public class TruckController {

    private final TruckRepository truckRepo;
    private final ReportTotalRepository totalRepo;

    @GetMapping
    public List<TruckDTO> listTrucks() {
        return truckRepo.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    @GetMapping("/{id}/reports")
    public ResponseEntity<?> getTruckHistory(@PathVariable Long id) {
        Truck truck = truckRepo.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Truck not found: " + id));

        List<TruckReportDTO> history = totalRepo.findByTruckIdOrderByReportDateDesc(id)
            .stream()
            .map(this::toReportDto)
            .collect(Collectors.toList());

        TruckDetailDTO detail = new TruckDetailDTO();
        detail.setId(truck.getId());
        detail.setTruckNumber(truck.getTruckNumber());
        detail.setReportCount(history.size());
        detail.setReports(history);
        return ResponseEntity.ok(detail);
    }

    private TruckDTO toDto(Truck t) {
        TruckDTO dto = new TruckDTO();
        dto.setId(t.getId());
        dto.setTruckNumber(t.getTruckNumber());
        dto.setCreatedAt(t.getCreatedAt());
        return dto;
    }

    private TruckReportDTO toReportDto(ReportTotal rt) {
        TruckReportDTO dto = new TruckReportDTO();
        dto.setReportId(rt.getReport().getId());
        dto.setOriginalFilename(rt.getReport().getOriginalFilename());
        dto.setWeekOf(rt.getReport().getWeekOf());
        dto.setUploadDate(rt.getReport().getUploadDate());
        dto.setStatus(rt.getReport().getStatus());
        dto.setDriverName(rt.getDriver() != null ? rt.getDriver().getName() : null);
        dto.setMainTotal(rt.getMainTotal());
        dto.setFuelTotal(rt.getFuelTotal());
        dto.setDriverPay(rt.getDriverPay());
        dto.setDriverPercentage(rt.getDriverPercentage());
        dto.setHasGeneratedPdf(rt.getGeneratedPdfPath() != null);
        return dto;
    }
}
