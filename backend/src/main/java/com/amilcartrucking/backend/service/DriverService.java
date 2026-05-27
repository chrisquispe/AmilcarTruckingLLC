package com.amilcartrucking.backend.service;

import com.amilcartrucking.backend.dto.DriverCreateDTO;
import com.amilcartrucking.backend.dto.DriverDTO;
import com.amilcartrucking.backend.model.Driver;
import com.amilcartrucking.backend.repository.DriverRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DriverService {

    private final DriverRepository driverRepo;

    public List<DriverDTO> getAllDrivers() {
        return driverRepo.findAllByOrderByIsCommonDescNameAsc()
            .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public DriverDTO createDriver(DriverCreateDTO dto) {
        Driver d = new Driver();
        d.setName(dto.getName().trim());
        d.setCommon(dto.isCommon());
        return toDto(driverRepo.save(d));
    }

    @Transactional
    public DriverDTO updateDriver(Long id, DriverCreateDTO dto) {
        Driver d = driverRepo.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Driver not found: " + id));
        if (dto.getName() != null) d.setName(dto.getName().trim());
        d.setCommon(dto.isCommon());
        return toDto(driverRepo.save(d));
    }

    @Transactional
    public void deleteDriver(Long id) {
        driverRepo.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Driver not found: " + id));
        driverRepo.deleteById(id);
    }

    public DriverDTO toDto(Driver d) {
        DriverDTO dto = new DriverDTO();
        dto.setId(d.getId());
        dto.setName(d.getName());
        dto.setCommon(d.isCommon());
        return dto;
    }
}
