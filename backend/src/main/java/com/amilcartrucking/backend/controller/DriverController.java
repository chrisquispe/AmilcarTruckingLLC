package com.amilcartrucking.backend.controller;

import com.amilcartrucking.backend.dto.DriverCreateDTO;
import com.amilcartrucking.backend.dto.DriverDTO;
import com.amilcartrucking.backend.service.DriverService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/drivers")
@RequiredArgsConstructor
public class DriverController {

    private final DriverService driverService;

    @GetMapping
    public List<DriverDTO> listDrivers() {
        return driverService.getAllDrivers();
    }

    @PostMapping
    public ResponseEntity<?> createDriver(@Valid @RequestBody DriverCreateDTO dto) {
        try {
            return ResponseEntity.ok(driverService.createDriver(dto));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDriver(@PathVariable Long id, @Valid @RequestBody DriverCreateDTO dto) {
        try {
            return ResponseEntity.ok(driverService.updateDriver(id, dto));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDriver(@PathVariable Long id) {
        try {
            driverService.deleteDriver(id);
            return ResponseEntity.ok(Map.of("message", "Driver deleted"));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
